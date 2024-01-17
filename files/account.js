let editingTaskId = null;
$(document).ready(function () {
  fetchUserDetails();
  fetchTasks();

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



  $(document).on('click', '.completeTaskBtn', function () {
    var taskId = $(this).data('id');
    completeTask(taskId);
  });
});

function fetchUserDetails() {
  $.ajax({
    url: '/account-detail',
    method: 'GET',
    success: function (response) {
      $('#welcomeUser').html('<h2>Welcome, ' + response.username + '</h2>');
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

  // Validate input here if necessary
  if (!name || !description || !deadline) {
    $('#userFeedback').text('Please fill in all fields').show();
    return; // Exit the function if validation fails
  }

  $.ajax({
    url: '/tasks',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ name, description, deadline }),
    success: function (response) {
      // Refresh the task list to include the new task
      fetchTasks();

      // Clear the form fields for a new entry
      $('#taskName').val('');
      $('#taskDescription').val('');
      $('#taskDeadline').val('');
      editingTaskId = null; // Reset any editing state

      // Hide the task form after saving
      $('#taskForm').hide();

      // Provide feedback to the user that the task was successfully saved
      $('#userFeedback').text('Task saved successfully').show().fadeOut(3000); // Message will fade out after 3 seconds
    },
    error: function (xhr, status, error) {
      // Handle any errors that occur during the request
      console.error('Error saving task:', status, error);
      $('#userFeedback').text('Error saving task. Please try again.').show();
    }
  });
}


$('#logoutBtn').click(function () {
  $.ajax({
      url: '/logout',
      type: 'POST',
      success: function(response) {
          // Redirect to the login page after successful logout
          window.location.href = '/login';
      },
      error: function(error) {
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
          '<button class="completeTaskBtn" data-id="' + task.id + '">Complete</button>' +
          '<button class="deleteTaskBtn" data-id="' + task.id + '">Delete</button>' +
          '<button class="setreminderBtn" data-id="' + task.id + '">Set Reminder</button>' +
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




function completeTask(taskId) {
  // Implement the logic to mark a task as completed
  // This might involve updating the task status in your database
}