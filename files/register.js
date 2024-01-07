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

$(document).on('click','#loginBtn',function(){
	var username = document.getElementById("logName").value;
	var password = document.getElementById("logPassword").value;

	if (username == "" || password == "") {
		document.getElementById("errorMsg").innerHTML = "Please fill the required fields"
		return false;
	}

    $.ajax({
        url: "/login",
        method: "POST",
        data: JSON.stringify({ username, password }),
        contentType: "application/json",
        success: function (response) {
          alert("Successfully logged in");
          window.location.href = "/account";
        },
        error: function (xhr, status, error) {
          document.getElementById("errorMsg").innerHTML = "Invalid username or password.";
        }
      });
    
      return false; // Prevent form submission
    });
	
    $(document).on('click','#signupBtn',function(){
	var email = document.getElementById("signEmail").value;
	var username = document.getElementById("signName").value;
	var password = document.getElementById("signPassword").value;

	if (username == "" || email == "" || password == "") {
		document.getElementById("errorMsg").innerHTML = "Please fill the required fields"
		return false;
	}

	else if (password.length < 8) {
		document.getElementById("errorMsg").innerHTML = "Your password must include atleast 8 characters"
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
              alert('Successfully registered');
        // window.location.href = '/login';
            },
            error: function (xhr, status, error) {
              document.getElementById('errorMsg').innerHTML = 'Registration failed. Please try again.';
            }
          });
        
        
	}
});

$(document).on('click', '#logoutBtn', function() {
  $.ajax({
    url: '/logout',
    method: 'POST',
    success: function(response) {
      alert('Successfully logged out');
      window.location.href = '/';
    },
    error: function(xhr, status, error) {
      console.error(error);
    }
  });

  return false; // Prevent form submission
});
