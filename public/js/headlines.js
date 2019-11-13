document.onreadystatechange = function() {
  if (document.readyState == "interactive") {
    let jwt_token = $('meta[name="token"]').attr("content");
    let projectKeys = [];

    // Shows the dialog when the "Show dialog" button is clicked
    AJS.$("#dialog-show-button").click(function(e) {
      e.preventDefault();
      AJS.dialog2("#credential-dialog").show();
    });

    // Hides the dialog
    AJS.$("#dialog-close-button").click(function(e) {
      e.preventDefault();
      AJS.dialog2("#credential-dialog").hide();
    });

    function addChangeListener() {
      let elements = document.getElementsByClassName("project-link");
      let loader = document.getElementsByClassName("loader")[0];

      for (let i = 0; i <= elements.length - 1; i++) {
        const current = elements[i];
        current.addEventListener("change", function(e) {
          loader.classList.remove("hide-loader");
          if (
            e.target.checked &&
            projectKeys.findIndex(key => key == e.target.name) === -1
          ) {
            projectKeys.push(e.target.name);
            sendReq(projectKeys.toString());
          } else {
            const index = projectKeys.findIndex(key => key == e.target.name);
            projectKeys.splice(index, 1);
            sendReq(projectKeys.toString());
          }
        });
      }
    }

    function sendReq(projectkey) {
      if (projectKeys.length > 0) {
        let loader = document.getElementsByClassName("loader")[0];
        var XHR = new XMLHttpRequest();

        XHR.onreadystatechange = function() {
          if (XHR.readyState == 4) {
            if (XHR.status == 200) {
              $("body").html(XHR.responseText);
              loader.classList.add("hide-loader");
              addChangeListener();
              projectKeys = [];
            } else {
              console.log("There was a problem!!!");
            }
          }
        };

        XHR.open("GET", `headlines?projectKey=${projectkey}`);
        XHR.setRequestHeader("Authorization", `JWT ${jwt_token}`);
        XHR.send();
      }
    }
    addChangeListener();
  }
};
