$(window).on("hashchange", function () {
  if (location.hash.slice(1) == "signup") {
    $(".page").addClass("extend");
    $("#login").removeClass("active");
    $("#signup").addClass("active");
  } else {
    $(".page").removeClass("extend");
    $("#login").addClass("active");
    $("#signup").removeClass("active");
  }
});
$(window).trigger("hashchange");

$(document).on('click', '#loginBtn', function () {
  var username = document.getElementById("logName").value;
  var password = document.getElementById("logPassword").value;

  if (username == "" || password == "") {
    displayMessage("Please fill the required fields");
    return false;
  }

  $.ajax({
    url: "/login",
    method: "POST",
    data: JSON.stringify({ username, password }),
    contentType: "application/json",
    success: function (response) {
      alert("Successfully logged in");
      window.location.href = "/dashboard";
    },
    error: function (xhr, status, error) {
      displayMessage("Invalid username or password.");
    }
  });

  return false; // Prevent form submission
});



function displayMessage(message) {
  const errorMsgElement = $('#errorMsg');
  errorMsgElement.html(message).show();

  // Use jQuery's fadeOut to slowly fade the message after 2 seconds
  setTimeout(function () {
    errorMsgElement.fadeOut('slow');
  }, 2000);
}





$(document).on('click', '#signupBtn', function () {
  var email = document.getElementById("signEmail").value;
  var username = document.getElementById("signName").value;
  var password = document.getElementById("signPassword").value;

  if (username == "" || email == "" || password == "") {
    displayMessage("Please fill the required fields");
    return false;
  } else if (password.length < 8) {
    displayMessage("Your password must include at least 8 characters");
    return false;
  }

  else {

    $.ajax({
      url: '/signup',
      method: 'POST',
      data: JSON.stringify({ username, password, email }),
      contentType: 'application/json',
      success: function (response) {
        console.log(response)
        displayMessage("Successfully registered");
        // window.location.href = '/login';
        // Clear input fields after successful registration
        $("#signEmail").val('');
        $("#signName").val('');
        $("#signPassword").val('');
      },
      error: function (xhr, status, error) {
        displayMessage("Registration failed. Please try again.");
      }
    });
  }
  return false; // Prevent form submission
});

$(document).on('click', '#logoutBtn', function () {
  $.ajax({
    url: '/logout',
    method: 'POST',
    success: function (response) {
      alert('Successfully logged out');
      window.location.href = '/';
    },
    error: function (xhr, status, error) {
      console.error(error);
    }
  });

  return false; // Prevent form submission
});
