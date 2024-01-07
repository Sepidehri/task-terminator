

// Delete a user
function deleteUser(userId) {
    $.ajax({
      url: `/users/${userId}`,
      method: 'DELETE',
      success: function(response) {
        console.log(response); // User deleted successfully
      },
      error: function(xhr, status, error) {
        console.error(error); // User not found or server error
      }
    });
  }
  
  // Update a user
  function updateUser(userId, updatedUser) {
    $.ajax({
      url: `/users/${userId}`,
      method: 'PUT',
      data: JSON.stringify(updatedUser),
      contentType: 'application/json',
      success: function(response) {
        console.log(response); // User updated successfully
      },
      error: function(xhr, status, error) {
        console.error(error); // User not found or server error
        // Handle the error case or display an error message
      }
    });
  }
  