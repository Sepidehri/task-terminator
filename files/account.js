let editingTaskId = null;
$(document).ready(function () {
  fetchUserDetails();
  fetchTasks();

  $("#reminderDate").datepicker({
    dateFormat: "yy-mm-dd"
  });

  $('#createTaskBtn').click(function () {
    // Clear the form fields
    $('#taskName').val('');
    $('#taskDescription').val('');
    $('#taskDeadline').val('');

    // Reset any editing state
    editingTaskId = null;

    // Show the form
    $('#taskForm').show();

    // Optionally, focus on the first input field
    $('#taskName').focus();
  });

  $('#saveTaskBtn').click(function () {
    if (editingTaskId) {
      updateTask(editingTaskId);
    } else {
      saveTask();
    }
  });

  $(document).on('click', '.deleteTaskBtn', function () {
    var taskId = $(this).data('id');
    deleteTask(taskId);
  });


  // Event listener for the Edit button
  $(document).on('click', '.editTaskBtn', function () {
    var taskId = $(this).data('id');
    populateEditForm(taskId);
  });



  // Event listener for the "Set Reminder" button
  $(document).on('click', '.setreminderBtn', function () {
    // Assuming you want to use the same form for setting reminders
    $('#reminderForm').show();
    // Initialize the datepicker for the reminderDate input
    $("#reminderDate").datepicker({
      dateFormat: "yy-mm-dd"
    });
    // You might want to store the task ID so you know which task to set the reminder for
    var taskId = $(this).data('id');
    setupReminder(taskId); // Call the function to set up the reminder
    $('#reminderForm').data('taskId', taskId);
  });


  $(document).on('click', '.completeTaskBtn', function () {
    console.log('Complete button clicked');
    var taskId = $(this).data('id');
    markTaskAsComplete(taskId, this);
  });
});


// Function to show the reminder form and set up the datepicker
function setupReminder(taskId) {
  // Store task ID in data attribute to be used later
  $('#reminderForm').data('taskId', taskId);

  // Show reminder form
  $('#reminderForm').show();

  // Initialize the datepicker
  $("#reminderDate").datepicker({
    dateFormat: "yy-mm-dd"
  });

  // Focus on the reminder date field
  $('#reminderDate').focus();
}





// Function to handle setting the reminder
$('#saveReminderBtn').click(function () {
  var taskId = $('#reminderForm').data('taskId');
  var reminderDate = $('#reminderDate').val();
  var reminderTime = $('#reminderTime').val();

  // Validate the reminder date and time
  if (!reminderDate || !reminderTime) {
    $('#userFeedback').text('Please select both date and time for the reminder').show();
    return; // Exit the function if validation fails
  }

  // Combine date and time to create a full datetime string
  var reminderDateTime = reminderDate + 'T' + reminderTime;

  // AJAX call to server to set reminder
  $.ajax({
    url: '/tasks/' + taskId + '/set-reminder',
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ reminderDateTime: reminderDateTime }),
    success: function (response) {
      // Hide the reminder form and show feedback
      $('#reminderForm').hide();
      $('#reminderDate').val(''); // Reset the date field
      $('#reminderTime').val(''); // Reset the time field
      $('#userFeedback').text('Reminder set successfully').show().fadeOut(3000);
      // Additional code to handle the response
    },
    error: function (xhr, status, error) {
      console.error('Error setting reminder:', error);
      $('#userFeedback').text('Error setting reminder').show();
    }
  });
});






function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function fetchUserDetails() {
  $.ajax({
    url: '/account-detail',
    method: 'GET',
    success: function (response) {
      // Assuming response.username is a string with the user's name
      var displayName = capitalizeFirstLetter(response.username);
      $('#welcomeUser').html('<h2>Welcome ' + displayName + '!</h2>');
    },
    error: function (error) {
      console.error('Error fetching user details:', error);
    }
  });
}


function saveTask() {
  var name = $('#taskName').val();
  var description = $('#taskDescription').val();
  var deadline = $('#taskDeadline').val();

  if (!name || !description || !deadline) {
      $('#userFeedback').text('Please fill in all fields').show();
      return;
  }

  $.ajax({
      url: '/tasks',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name, description, deadline }),
      success: function (response) {
          fetchTasks();
          $('#taskName').val('');
          $('#taskDescription').val('');
          $('#taskDeadline').val('');
          editingTaskId = null;
          $('#taskForm').hide();
          $('#userFeedback').text('Task saved successfully').show().fadeOut(3000);
      },
      error: function (xhr, status, error) {
          console.error('Error saving task:', status, error);
          $('#userFeedback').text('Error saving task. Please try again.').show();
      }
  });
}



$('#logoutBtn').click(function () {
  $.ajax({
    url: '/logout',
    type: 'POST',
    success: function (response) {
      // Redirect to the login page after successful logout
      window.location.href = '/login';
    },
    error: function (error) {
      alert('Logout failed. Please try again.');
    }
  });
});



function fetchTasks() {
  $.ajax({
    url: '/tasks',
    method: 'GET',
    success: function (tasks) {
      var taskList = $('#taskList');
      taskList.empty();

      tasks.forEach(function (task) {
        var taskHtml = '<div id="task-' + task.id + '" ' +
          'data-name="' + task.name + '" ' +
          'data-description="' + task.description + '" ' +
          'data-deadline="' + task.deadline + '">' +
          '<h3>' + task.name + '</h3>' +
          '<p>' + task.description + '</p>' +
          '<p>Deadline: ' + task.deadline + '</p>' +
          '<button class="editTaskBtn" data-id="' + task.id + '">Edit</button>' +
          '<button class="deleteTaskBtn" data-id="' + task.id + '">Delete</button>' +
          '<button class="setreminderBtn" data-id="' + task.id + '">Set Reminder</button>' +
          '<button class="completeTaskBtn" data-id="' + task.id + '">Mark as Complete</button>' +
          '</div>';
        taskList.append(taskHtml);
      });

    },
    error: function (xhr, status, error) {
      // Handle error
      console.error('Error fetching tasks:', status, error);
    }
  });
}
tasks.forEach(function (task) {
  var taskHtml = '<div class="task" id="task-' + task.id + '" ' +
    // ... rest of your task HTML structure
    taskList.append(taskHtml);
});


function deleteTask(taskId) {
  $.ajax({
    url: '/tasks/' + taskId,
    method: 'DELETE',
    success: function (response) {
      // Remove the task from the UI
      $('#task-' + taskId).remove();

      // Optionally, show feedback to the user that the task was deleted
      $('#userFeedback').text('Task deleted successfully').show().fadeOut(3000);
    },
    error: function (xhr, status, error) {
      // Handle any errors that occur during the request
      console.error('Error deleting task:', status, error);
      $('#userFeedback').text('Error deleting task. Please try again.').show();
    }
  });
}




// This function is triggered when the Edit button is clicked
function populateEditForm(taskId) {
  var taskElement = $('#task-' + taskId);
  var taskName = taskElement.data('name');
  var taskDescription = taskElement.data('description');
  var taskDeadline = taskElement.data('deadline');

  $('#taskName').val(taskName);
  $('#taskDescription').val(taskDescription);
  $('#taskDeadline').val(taskDeadline);

  editingTaskId = taskId; // Store the editing task's ID
  $('#taskForm').show(); // Show the form for editing
}


// This function sends the updated task to the server
function updateTask(taskId) {
  var name = $('#taskName').val();
  var description = $('#taskDescription').val();
  var deadline = $('#taskDeadline').val();

  $.ajax({
    url: '/tasks/' + taskId,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ name, description, deadline }),
    success: function (response) {
      fetchTasks(); // Re-fetch the tasks and update the DOM
      $('#taskForm').hide();
      editingTaskId = null; // Reset the editing state
      $('#userFeedback').text('Task updated successfully').show().fadeOut(3000);
    },

    error: function (xhr, status, error) {
      console.error('Error updating task:', status, error);
      $('#userFeedback').text('Error updating task. Please try again.').show();
    }
  });

}


function markTaskAsComplete(taskId, buttonElement) {
  $.ajax({
    url: '/tasks/completed/' + taskId,
    method: 'PUT',
    success: function(response) {
      $(buttonElement).text('Completed')
        .addClass('completed-button-style')
        .prop('disabled', true);
      // Optionally, you can remove the task from the list or refresh the tasks
    },
    error: function(error) {
      console.error('Error marking task as complete:', error);
    }
  });
}


function fetchCompletedTasks() {
  $.ajax({
    url: '/tasks',
    method: 'GET',
    success: function (tasks) {
      var completedTaskList = $('#completedTaskList');
      completedTaskList.empty(); // Clear existing tasks

      tasks.forEach(function (task) {
        // Only append tasks that are completed
        if (task.completed) {
          var taskHtml = '<div class="completed-task" id="completed-task-' + task.id + '">' +
            '<h3>' + task.name + '</h3>' +
            '<p>' + task.description + '</p>' +
            '<p>Deadline: ' + task.deadline + '</p>' +
            '<p>Status: Completed</p>' +
            '</div>';
          completedTaskList.append(taskHtml);
        }
      });

      // Check if there are completed tasks to show
      if (completedTaskList.children().length === 0) {
        completedTaskList.html('<p>No completed tasks found.</p>');
      }
    },
    error: function (xhr, status, error) {
      console.error('Error fetching completed tasks:', status, error);
      $('#userFeedback').text('Error fetching completed tasks').show();
    }
  });
}


