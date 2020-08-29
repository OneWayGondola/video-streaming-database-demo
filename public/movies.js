const baseURL = `http://localhost:3000/movies`;

// Elements
var filter_button = document.getElementById("filter_button");
var filter_movie_id= document.getElementById("filter_movie_id");
var filter_title = document.getElementById("filter_title");
var filter_genre = document.getElementById("filter_genre");
var filter_runtime = document.getElementById("filter_runtime");

console.log("movies.js loaded");

// Filters the results when clicking the filter button
filter_button.addEventListener("click", function(event){
    console.log("filtered clicked");

    // Form a new post request and response to that request
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", baseURL, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.addEventListener("load", function(){
        console.log("client received initial response");
        if(xhttp.status >= 200 && xhttp.status < 400){
            console.log("valid server response");
            var filtered_movies = JSON.parse(xhttp.response);
            console.log(filtered_movies);
            // Clear full movie table
            var movies_rows = document.getElementById("movies_rows");
            movies_rows.innerHTML = "";
            console.log("table cleared");
            
            for (i=0; i < filtered_movies.length; i++){
                // New row
                var new_row = document.createElement("tr");
                movies_rows.appendChild(new_row);
                new_row.id = filtered_movies[i].movie_id.toString();

                // Table data
                var td_movie_id = document.createElement("td");
                new_row.appendChild(td_movie_id);
                td_movie_id.id = "td_movie_id" + filtered_movies[i].movie_id.toString();
                td_movie_id.innerHTML = filtered_movies[i].movie_id.toString();

                var td_title = document.createElement("td");
                new_row.appendChild(td_title);

                var td_genre = document.createElement("td");
                new_row.appendChild(td_genre);

                var td_runtime = document.createElement("td");
                new_row.appendChild(td_runtime);

                var td_edit = document.createElement("td");
                new_row.appendChild(td_edit);

                var td_delete = document.createElement("td");
                new_row.appendChild(td_delete);

                var input_title = document.createElement("input");
                td_title.appendChild(input_title);
                input_title.id = "input_title" + filtered_movies[i].movie_id;
                input_title.value = filtered_movies[i].title;
                input_title.disabled = true;

                var input_genre = document.createElement("input");
                td_genre.appendChild(input_genre);
                input_genre.id = "input_genre" + filtered_movies[i].movie_id;
                input_genre.value = filtered_movies[i].genre;
                input_genre.disabled = true;

                var input_runtime = document.createElement("input");
                td_runtime.appendChild(input_runtime);
                input_runtime.id = "input_runtime" + filtered_movies[i].movie_id;
                input_runtime.value = filtered_movies[i].runtime;
                input_runtime.disabled = true;

                // Buttons
                var button_edit = document.createElement("button");
                button_edit.className = "btn btn-primary";
                button_edit.innerHTML = "Edit";
                button_edit.setAttribute("onclick", "edit_entry(" + filtered_movies[i].movie_id + ")");
                button_edit.id = "edit" + filtered_movies[i].movie_id;
                td_edit.appendChild(button_edit);

                var button_delete = document.createElement("button");
                button_delete.className = "btn btn-danger";
                button_delete.innerHTML = "Delete";
                button_delete.setAttribute("onclick", "delete_entry(" + filtered_movies[i].movie_id + ")");
                td_delete.appendChild(button_delete);
            }
            console.log("table filtered");
        };
    });

    // Grabs values from filter input fields and stores them into a JSON object.
    var movie_fields = {};
    movie_fields.request = "filter"; // Tells the server what action the user is taking.
    movie_fields.movie_id = movie_fields.movie_id = filter_movie_id.value;
    movie_fields.title = filter_title.value;
    movie_fields.genre = filter_genre.value;
    movie_fields.runtime = filter_runtime.value;
    var JSON_movie_fields = JSON.stringify(movie_fields);    

    // Sends the filter request
    xhttp.send(JSON_movie_fields);
    event.preventDefault();
});

// Deletes the entry when clicking the corresponding delete button
function delete_entry(row_id){
    console.log("Delete button clicked for row " + row_id);

    // Form a new delete request and response to that request
    var xhttp = new XMLHttpRequest();
    xhttp.open("DELETE", baseURL, true);
    xhttp.addEventListener("load", function(){
        if(xhttp.status >= 200 && xhttp.status < 400)
        {
            // Removes row instead of refreshing page
            console.log("Delete request processed by server.");
            document.getElementById(row_id).remove();
        }
    });
    
    // The content to sent to the server
    var content = {};
    content.row_id = row_id;
    
    // Sends the delete request
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(content));
    console.log("Client requests deletion operation.");

    event.preventDefault();
}

// Edits or updates the entry when clicking the corresponding update button
function edit_entry(row_id){
    console.log("Edit button clicked for row " + row_id);
    
    // If the button says "edit", enables input fields for entries, and changes button to "update"
    if (document.getElementById("edit" + row_id).innerHTML == "Edit"){
        //document.getElementById("input_movie_id" + row_id).disabled = false;
        document.getElementById("input_title" + row_id).disabled = false;
        document.getElementById("input_genre" + row_id).disabled = false;
        document.getElementById("input_runtime" + row_id).disabled = false;
        document.getElementById("edit" + row_id).innerHTML = "Update";
        return;
    }

    // Aborts and alerts user if any of the fields are empty
    if (document.getElementById("input_title" + row_id).value == "" || 
        document.getElementById("input_genre" + row_id).value == "" || 
        document.getElementById("input_runtime" + row_id).value == ""){
        window.alert("Please fill out all the input fields.");
        return;
    }

    // Aborts and alerts user if the runtime is not an integer
    if (isNaN(document.getElementById("input_runtime" + row_id).value)){
        window.alert("Runtime must be an integer.");
        return;
    }
    


    // Re-enables in the input fields and changes edit button from "Edit" to "Update"
    document.getElementById("edit" + row_id).innerHTML = "Edit";
    document.getElementById("input_title" + row_id).disabled = true;
    document.getElementById("input_genre" + row_id).disabled = true;
    document.getElementById("input_runtime" + row_id).disabled = true;    

    // Form a new post request and response to that request
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", baseURL, true);
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
    content.request = "update"; // Tells the server what action the user is taking.
    content.movie_id = document.getElementById("td_movie_id" + row_id).innerHTML;
    content.old_movie_id = row_id; // This is starting id value of the movie_id before it's updated
    content.title = document.getElementById("input_title" + row_id).value;
    content.genre = document.getElementById("input_genre" + row_id).value;
    content.runtime = document.getElementById("input_runtime" + row_id).value;

    // Sends the update request
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(content));
    console.log("Client requests update operation.");

    event.preventDefault();
}

// Inserts new movie entry when clicking on add movie button
function add_entry(){
    console.log("Add movie button clicked");

    // Aborts and alerts user if any of the fields are empty
    if (document.getElementById("new_title").value == "" || 
        document.getElementById("new_genre").value == "" || 
        document.getElementById("new_runtime").value == ""){
        window.alert("Please fill out all the fields.");
        return;
    }

    // Aborts and alerts user if the runtime is not an integer
    if (isNaN(document.getElementById("new_runtime").value)){
        window.alert("Runtime must be an integer.");
        return;
    }

    // Form a new post request and response to that request
    var xhttp = new XMLHttpRequest;
    xhttp.open("POST", baseURL, true);
    xhttp.addEventListener("load", function(){
        if (xhttp.status >= 200 && xhttp.status < 400){
            console.log("Add POST request acknowledged by server.");
            
            // Forces the page to reload to get an updated table
            location.reload();
            return false;
        }
    });

    // Grabs values from corresponding add customer input fields and stores them into a JSON object.
    var content = {};
    content.request = "add";
    content.title = document.getElementById("new_title").value;
    content.genre = document.getElementById("new_genre").value;
    content.runtime = document.getElementById("new_runtime").value;    

    // Sends the post request
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(content));
    console.log("Client requests add POST operation.");

} 