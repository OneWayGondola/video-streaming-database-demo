const c_m_url = `http://localhost:3000/customers_movies`;

// Elements
var filter_button = document.getElementById("filter_button");
var filter_customer_id= document.getElementById("filter_customer_id");
var filter_movie_id = document.getElementById("filter_movie_id");
var filter_last_watched = document.getElementById("filter_last_watched");
var filter_rating = document.getElementById("filter_rating");

console.log("customers_movies.js loaded");

// Clicking the filter button
filter_button.addEventListener("click", function(event){
    console.log("filtered clicked");
    // Makes a new POST request to the server for filtered table results
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", c_m_url, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    
    // Check for all empty fields here, prompt error message to user, and return

    // Grabs values from filter input fields and stores them into a JSON object.
    var customers_movies_fields = {};
    customers_movies_fields.request = "filter"; // Tells the server what action the user is taking.
    customers_movies_fields.customer_id = filter_customer_id.value;
    customers_movies_fields.movie_id = filter_movie_id.value;
    customers_movies_fields.last_watched = filter_last_watched.value;
    customers_movies_fields.rating = filter_rating.value;

    // Once the client receives a valid response from the server...
    xhttp.addEventListener("load", function(){
        console.log("client received initial response");
        if(xhttp.status >= 200 && xhttp.status < 400){
            console.log("valid server response");
            var filtered_customers_movies = JSON.parse(xhttp.response);
            console.log(filtered_customers_movies);
            // Clear full movie table
            var customers_movies_rows = document.getElementById("customers_movies_rows");
            customers_movies_rows.innerHTML = "";
            console.log("table cleared");
            
            for (i=0; i < filtered_customers_movies.length; i++){
                // New row
                var new_row = document.createElement("tr");
                customers_movies_rows.appendChild(new_row);
                new_row.id = filtered_customers_movies[i].customer_id.toString() + "." + filtered_customers_movies[i].movie_id.toString();

                // Table data
                var td_customer_id = document.createElement("td");
                new_row.appendChild(td_customer_id);
                td_customer_id.innerHTML = filtered_customers_movies[i].customer_id;
                var td_movie_id = document.createElement("td");
                new_row.appendChild(td_movie_id);
                td_movie_id.innerHTML = filtered_customers_movies[i].movie_id;
                var td_last_watched = document.createElement("td");
                new_row.appendChild(td_last_watched);
                td_last_watched.innterHTML = filtered_customers_movies[i].last_watched;
                var td_rating = document.createElement("td");
                new_row.appendChild(td_rating);
                var td_edit = document.createElement("td");
                new_row.appendChild(td_edit);
                var td_delete = document.createElement("td");
                new_row.appendChild(td_delete);

                // Inputs
                var input_rating = document.createElement("input");
                td_rating.appendChild(input_rating);
                input_rating.value = filtered_customers_movies[i].rating;
                input_rating.id = "input_rating" + filtered_customers_movies[i].customer_id + "." + filtered_customers_movies[i].movie_id;
                input_rating.disabled = true;

                // Buttons
                var button_edit = document.createElement("button");
                button_edit.className = "btn-primary";
                button_edit.innerHTML = "Edit";
                button_edit.id = "edit" + filtered_customers_movies[i].customer_id + "." + filtered_customers_movies[i].movie_id;
                button_edit.setAttribute("onclick", "edit_entry(" + filtered_customers_movies[i].customer_id + "," + 
                    filtered_customers_movies[i].movie_id + ");");
                td_edit.appendChild(button_edit);
                var button_delete = document.createElement("button");
                button_delete.className = "btn-danger";
                button_delete.innerHTML = "Delete";
                button_delete.id = "delete" + filtered_customers_movies[i].customer_id + "." + filtered_customers_movies[i].movie_id;
                button_delete.setAttribute("onclick", "delete_entry(" + filtered_customers_movies[i].customer_id + "," + 
                    filtered_customers_movies[i].movie_id + ");");
                td_delete.appendChild(button_delete);
            }
            console.log("table filtered");
        };
    });

    // Sends payload to server as JSON object
    xhttp.send(JSON.stringify(customers_movies_fields));

    event.preventDefault();
});

function delete_entry(customer_id, movie_id){
    console.log("Delete button clicked for row " + customer_id + "." + movie_id);

    // Form a new delete request and response to that request
    var xhttp = new XMLHttpRequest();
    xhttp.open("DELETE", c_m_url, true);
    xhttp.addEventListener("load", function(){
        if(xhttp.status >= 200 && xhttp.status < 400)
        {
            // Removes row instead of refreshing page
            console.log("Server status good.");
            document.getElementById(customer_id + "." + movie_id).remove();
        }
    });
    
    // The content to send to the server
    var content = {};
    content.customer_id = customer_id;
    content.movie_id = movie_id;
    
    // Sending the delete request
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(content));
    console.log("Client requests deletion operation.");

    event.preventDefault();
}

// M:M Insert
document.getElementById('submit_relation').addEventListener('click', (event) => {
    var email_select = document.getElementById("email_select");
    var customer_id = email_select.options[email_select.selectedIndex].value;
    var movie_select = document.getElementById("movie_select");
    var movie_id = movie_select.options[movie_select.selectedIndex].value;
    var reqBody = {};
    reqBody['MM_customer_id'] = customer_id;
    reqBody['MM_movie_id'] = movie_id;
    console.log(reqBody);
    var req = new XMLHttpRequest();
    req.open('POST', c_m_url)
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', () => {
        window.location.reload();
    });
    req.send(JSON.stringify(reqBody));
});

// Selecting an email on Update rating page
// document.getElementById('email_select_2').addEventListener('click', (event) => {
//     if (event.target.tagName.toLowerCase() === 'option') {
//         var customer_id = event.target.value;
//         // var reqBody = {};
//         // reqBody['UR_customer_id'] = customer_id;
//         var req = new XMLHttpRequest();
//         req.open('GET', c_m_url + '?customer_id=' + customer_id)
//         // req.setRequestHeader('Content-Type', 'application/json');
//         req.addEventListener('load', () => {});
//         // JSON.stringify(reqBody)
//         req.send();
//     }
// });

// Edits or updates the entry when clicking the corresponding update button
function edit_entry(customer_id, movie_id){
    console.log("Edit button clicked for row " + customer_id + "." + movie_id);
    
    // If the button says "edit", enables input fields for entries, and changes button to "update"
    if (document.getElementById("edit" + customer_id + "." + movie_id).innerHTML == "Edit"){
        document.getElementById("input_rating" + customer_id + "." + movie_id).disabled = false;
        document.getElementById("edit" + customer_id + "." + movie_id).innerHTML = "Update";
        return;
    }

    // Aborts and alerts user if any of the fields are empty
    if (document.getElementById("input_rating" + customer_id + "." + movie_id).value == ""){
        window.alert("Please fill out the rating field.");
        return;
    }

    // Aborts and alerts user if the runtime is not an integer
    if (isNaN(document.getElementById("input_rating" + customer_id + "." + movie_id).value) && 
        document.getElementById("input_rating" + customer_id + "." + movie_id).value != "null") {
        window.alert("Rating must be 1, 0, or null.");
        return;
    }
    

    // Re-enables in the input fields and changes edit button from "Edit" to "Update"
    document.getElementById("input_rating" + customer_id + "." + movie_id).disabled = true;
    document.getElementById("edit" + customer_id + "." + movie_id).innerHTML == "Update";

    // Form a new post request and response to that request
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", c_m_url, true);
    xhttp.addEventListener("load", function(){
        if (xhttp.status >= 200 && xhttp.status < 400){
            console.log("Update request processed by server.");

            // Forces the page to reload to get an updated table
            location.reload();
            return false;
        }
    });

    // Grabs values from corresponding input fields and stores them into a JSON object.
    var content = {};
    content.action = "update"; // Tells the server what action the user is taking.
    //content.movie_id = document.getElementById("td_movie_id" + row_id).innerHTML;
    //content.old_movie_id = row_id; // This is starting id value of the movie_id before it's updated
    content.customer_id = customer_id;
    content.movie_id = movie_id;
    content.rating = document.getElementById("input_rating" + customer_id + "." + movie_id).value;

    // Sends the update request
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(content));
    console.log("Client requests update operation.");

    event.preventDefault();
}