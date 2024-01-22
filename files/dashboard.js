let editingTaskId = null;


function requestNotificationPermission() {
  Notification.requestPermission().then(function (permission) {
    if (permission === "granted") {
      console.log("Notification permission granted.");
      // You can now show notifications
    }
  });
}

$(document).ready(function () {
  requestNotificationPermission();
  fetchUserDetails();
  fetchTasks();
  $("#reminderDate").datepicker({
    dateFormat: "yy-mm-dd"
  });

  $("#taskDeadline").datepicker({
    dateFormat: 'yy-mm-dd',
    minDate: 0 // Disables all the dates before today
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

  $(document).on
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


$(document).on('click', '#saveReminderBtn', function () {
  var taskId = $('#reminderForm').data('taskId');
  var reminderDate = $('#reminderDate').val();
  var reminderTime = $('#reminderTime').val();

  if (!reminderDate || !reminderTime) {
    $('#userFeedback').text('Please select both date and time for the reminder').show();
    return;
  }

  var selectedDateTime = new Date(reminderDate + ' ' + reminderTime);
  var currentDateTime = new Date();

  if (selectedDateTime <= currentDateTime) {
    $('#userFeedback').text('Cannot set a reminder in the past. Please select a future date and time.').show();
    return;
  }


  // AJAX call to server to set reminder
  $.ajax({
    url: '/tasks/' + taskId + '/set-reminder',
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ reminderDateTime: selectedDateTime.toISOString() }),
    success: function (response) {
      $('#reminderForm').hide();
      $('#reminderDate').val('');
      $('#reminderTime').val('');
      $('#userFeedback').text('Reminder set successfully').show().fadeOut(3000);
      //primitive solution so the reminder alerts will trigger everytime a new reminder is  set
      location.reload();
    },
    error: function (xhr, status, error) {
      console.error('Error setting reminder:', error);
      $('#userFeedback').text('Error setting reminder').show();
    }
  });
});



$(document).on('click', '#cancelReminderBtn', function () {
  $('#reminderForm').hide();
  $('#reminderDate').val('');
  $('#reminderTime').val('');
  $('#userFeedback').hide();
});


function scheduleReminder(task) {
  var reminderTime = new Date(task.reminderDateTime).getTime();
  var now = new Date().getTime();
  var timeUntilReminder = reminderTime - now;

  /*if (timeUntilReminder > 0) {
    setTimeout(async function () {
      window.alert('Reminder for task: ' + task.name);
      window.showNotification('Reminder for task: ' + task.name);

    }, timeUntilReminder);
  }*/
  if (timeUntilReminder > 0) {
    setTimeout(async function () {
      if ('Notification' in window) {
        // Request permission if not granted
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
        // Check permission again
        if (Notification.permission === 'granted') {
          new Notification('Task Reminder', {
            body: `Reminder for task: ${task.name}`,
          });
        }
      } else {
        // Fallback for browsers that don't support the Notification API
        alert('Reminder for task: ' + task.name);
      }
    }, timeUntilReminder);
  }
}


function showNotification(message) {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }
  else if (Notification.permission === "granted") {
    var notification = new Notification(message);
  }
}


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
  //var category = $('#taskCategory').options[$('#taskCategory').selectedIndex()].text;
  var category = $('#taskCategory').val();
  var priority = $('#taskPriority').val();


  if (!name || !description || !deadline || !category || !priority) {
    $('#userFeedback').text('Please fill in all fields').show();
    return;
  }

  $.ajax({
    url: '/tasks',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ name, description, deadline, category, priority }),
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

$(document).on('click', '#logoutBtn', function () {
  $.ajax({
    url: '/logout',
    type: 'POST',
    success: function (response) {
      // If logout is successful, redirect to the login page
      window.location.href = '/';
      alert('Successfully logged out');
    },
    error: function (xhr, status, error) {
      // Error handling
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  });
});



function fetchTasks(filter, sort) {
  let url;
  var sort = sort;
  if (filter === 'all' || !filter) {
    url = '/tasks'
  } else {
    url = '/tasks/category/' + filter;
  }
  /*if (sort) {
    url += '?sort=' + sort;
  }*/
  $.ajax({
    //url: '/tasks',
    url: url,
    method: 'GET',
    success: function (tasks) {
      sortByPriority(tasks, sort);
      var taskList = $('#taskList');
      taskList.empty();
      tasks.forEach(function (task) {
        scheduleReminder(task);

        // Determine button label and class based on completion status
        var buttonLabel = task.completed ? 'Completed' : 'Mark as Complete';
        var buttonClass = task.completed ? 'completed-button-style' : 'completeTaskBtn';
        var disabledAttribute = task.completed ? 'disabled="disabled"' : '';

        // Constructing the HTML for each task with data attributes
        var taskHtml = `
          <div class="task" id="task-${task.id}" 
            data-name="${task.name}" 
            data-description="${task.description}" 
            data-deadline="${task.deadline}" 
            data-reminder-date="${task.reminderDateTime || ''}">
            <div class="task-field">
              <label>Name:</label>
              <p>${task.name}</p>
            </div>
            <div class="task-field">
              <label>Description:</label>
              <p>${task.description}</p>
            </div>
            <div class="task-field">
              <label>Deadline:</label>
              <p>${task.deadline}</p>
            </div>
            <div class="task-field">
              <label>Category:</label>
              <p>${task.category}</p>
            </div>
            <div class="task-field">
              <label>Priority:</label>
              <p>${task.priority}</p>
            </div>
            <div class="task-actions">
              <button class="editTaskBtn" data-id="${task.id}">Edit</button>
              <button class="deleteTaskBtn" data-id="${task.id}">Delete</button>
              <button class="setreminderBtn" data-id="${task.id}">Set Reminder</button>
              <button class="${buttonClass}" data-id="${task.id}" ${disabledAttribute}>${buttonLabel}</button>
              <button class="addSubtaskBtn" data-task-id="${task.id}">Add Subtask</button>
            </div>
            <div class="subtasks" id="subtasks-${task.id}"></div>
            
          </div>
        `;
        taskList.append(taskHtml);



        /* // Set reminders for tasks with reminder date and time
         if (task.reminderDateTime) {
           scheduleReminder(task);
         }*/
      });

      // Reattach event listeners to the buttons
      reattachEventListeners();
    },
    error: function (xhr, status, error) {
      console.error('Error fetching tasks:', status, error);
      $('#userFeedback').text('Error fetching tasks').show();
    }
  });
}




$(document).on('click', '.addSubtaskBtn', function () {
  var taskId = $(this).data('task-id');
  // Call a function to handle the subtask addition (to be implemented)
  handleAddSubtask(taskId);
});


function handleAddSubtask(taskId) {
  // Create a simple form for subtask title and description
  var subtaskForm = `
    <div class="subtask-form">
      <input type="text" id="subtaskTitle-${taskId}" placeholder="Subtask Title">
      <textarea id="subtaskDesc-${taskId}" placeholder="Subtask Description"></textarea>
      <button class="saveSubtaskBtn" data-task-id="${taskId}">Save Subtask</button>
      <button class="cancelSubtaskBtn" data-task-id="${taskId}">Cancel</button>
    </div>
  `;

  // Append the form to the subtasks container
  $('#subtasks-' + taskId).append(subtaskForm);
}



$(document).on('click', '.saveSubtaskBtn', function () {
  var taskId = $(this).data('task-id');
  saveSubtask(taskId);
});

$(document).on('click', '.cancelSubtaskBtn', function () {
  var taskId = $(this).data('task-id');
  // Hide or remove the subtask form and clear any inputs
  $('#subtasks-' + taskId + ' .subtask-form').remove();
});


function saveSubtask(taskId) {
  var title = $('#subtaskTitle-' + taskId).val();
  var description = $('#subtaskDesc-' + taskId).val();
  
  if (!title) {
    alert('Please enter a subtask title.');
    return;
  }

  $.ajax({
    url: '/tasks/' + taskId + '/subtasks',
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ title, description }),
    success: function(subtask) {
      // Append the saved subtask to the UI
      var subtaskHtml = `<div class="subtask">
        <h4>${subtask.title}</h4>
        <p>${subtask.description}</p>
      </div>`;
      $('#subtasks-' + taskId).append(subtaskHtml);
    },
    error: function() {
      alert('Error saving subtask');
      console.error(this.error)
    }
  });

  // Clear and remove the form
  $('#subtasks-' + taskId + ' .subtasks').remove();
}


// Function to schedule a reminder
function scheduleReminder(task) {
  var reminderTime = new Date(task.reminderDateTime).getTime();
  var now = new Date().getTime();
  var timeUntilReminder = reminderTime - now;

  if (timeUntilReminder > 0) {
    setTimeout(function () {
      alert('Reminder for task: ' + task.name);
    }, timeUntilReminder);
  }
}

// Function to reattach event listeners
function reattachEventListeners() {
  // Reattach click event to the edit button
  $('.editTaskBtn').off('click').on('click', function () {
    var taskId = $(this).data('id');
    populateEditForm(taskId);
  });

  // Reattach click event to the delete button
  $('.deleteTaskBtn').off('click').on('click', function () {
    var taskId = $(this).data('id');
    deleteTask(taskId);
  });

  // Add other event listeners as needed
}

// Helper function to reattach event listeners after task list update
function reattachEventListeners() {
  // Reattach click event to the edit button
  $('.editTaskBtn').off('click').on('click', function () {
    var taskId = $(this).data('id');
    populateEditForm(taskId);
  });

  // Reattach click event to the delete button
  $('.deleteTaskBtn').off('click').on('click', function () {
    var taskId = $(this).data('id');
    deleteTask(taskId);
  });

  // ... reattach other event listeners as needed
}

tasks.forEach(function (task) {
  var taskHtml = '<div class="task" id="task-' + task.id + '" ' +
    // ... rest of your task HTML structure
    taskList.append(taskHtml);
    var subtasksHtml = task.subtasks.map(subtask => `
    <div class="subtask">
      <h4>${subtask.title}</h4>
      <p>${subtask.description}</p>
    </div>
  `).join('');

  var taskHtml = `
    <div class="task" id="task-${task.id}">
      <!-- Task fields -->
      <div class="subtasks" id="subtasks-${task.id}">${subtasksHtml}</div>
      <button class="addSubtaskBtn" data-task-id="${task.id}">Add Subtask</button>
      <!-- Task actions -->
    </div>
  `;
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
      //$('#userFeedback').text('Task deleted successfully').show().fadeOut(3000);
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
  //var category = $('#taskCategory').options[$('#taskCategory').selectedIndex()].text;
  var category = $('#taskCategory').val();
  var priority = $('#taskPriority').val();
  $.ajax({
    url: '/tasks/' + taskId,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ name, description, deadline, category, priority }),
    success: function (response) {
      fetchTasks(); // Re-fetch the tasks and update the DOM
      $('#taskForm').hide();
      editingTaskId = null; // Reset the editing state
      // $('#userFeedback').text('Task updated successfully').show().fadeOut(3000);
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
    success: function (response) {
      // Remove the task element from the dashboard
      $('#task-' + taskId).fadeOut('slow', function () {
        $(this).remove();
        fetchTasks(); // Re-fetch tasks to update the list
      });
    },
    error: function (error) {
      console.error('Error marking task as complete:', error);
    }
  });
}




function fetchCompletedTasks() {
  $.ajax({
    url: '/tasks/completed',
    method: 'GET',
    success: function (completedTasks) {
      var completedTaskList = $('#completedTaskList');
      completedTaskList.empty();

      if (completedTasks.length === 0) {
        completedTaskList.html('<p>No completed tasks found.</p>');
      } else {
        completedTasks.forEach(function (task) {
          var taskHtml = `<div class="completed-task" id="completed-task-${task.id}">
                      <h3>${task.name}</h3>
                      <p>${task.description}</p>
                      <p>Deadline: ${task.deadline}</p>
                      <p>Status: Completed</p>
                  </div>`;
          completedTaskList.append(taskHtml);
        });
      }
    },
    error: function (xhr, status, error) {
      console.error('Error fetching completed tasks:', status, error);
      $('#userFeedback').text('Error fetching completed tasks').show();
    }
  });
}

function sortByPriority(tasks, sort) {
  return tasks.sort((a, b) => {
    // Map priority values to numerical values for comparison
    const priorityValues = { 'high': 3, 'medium': 2, 'low': 1 };
    const priorityA = priorityValues[a.priority] || 0;
    const priorityB = priorityValues[b.priority] || 0;

    // Determine the sorting order based on the 'sort' parameter
    const sortOrder = (sort === 'asc') ? 1 : -1;

    // Return a negative, zero, or positive value to determine order
    return sortOrder * (priorityA - priorityB);
  });
}

function pushTasksToCalendar() {
  window.location.href = '/google';
  //fetchTasks();
  //$('#userFeedback').text('Tasks are now in your Google Calendar! #TaskTerminator').show();
}

window.onload = function () {
  // Check if the page URL contains '/push_tasks_to_calendar'
  if (window.location.href.includes('/push_tasks_to_calendar')) {
    // Display your alert or any other logic you want
    $('#userFeedback').text('Tasks are now in your Google Calendar! #TaskTerminator').show();
  }
};
