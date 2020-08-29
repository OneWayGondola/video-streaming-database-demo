var express = require('express');
var mysql = require('./dbcon.js');
const path = require('path');
var moment = require('moment'); // require
const { json } = require('body-parser');
moment().format();

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Queries
const insert_new_customer = "INSERT INTO Customers (`first_name`, `last_name`, `email`, `auto_pay`, `date_until_renew`) VALUES (?, ?, ?, '1', ?)";
const insert_Payment_Information = "INSERT INTO Payment_Information (`is_primary`, `first_name`, `last_name`, `card_number`, `billing_address`, `customer_id`) VALUES (?, ?, ?, ?, ?, ?)";
const get_payment_for_customer = 'SELECT * FROM Payment_Information WHERE customer_id=?';
// Set the is_primary attribute of the current primary of c_id to 0.
const set_is_primary_to_false = 'UPDATE Payment_Information SET is_primary=0 WHERE customer_id=? AND is_primary=1';
const set_is_primary_to_true = 'UPDATE Payment_Information SET is_primary=1 WHERE payment_id=?';
const update_customer = 'UPDATE Customers SET first_name=?, last_name=?, email=?, auto_pay=? WHERE customer_id=?';
const update_payment = 'UPDATE Payment_Information SET first_name=?, last_name=?, billing_address=? WHERE payment_id=?';

const insert_Customers_Movies = 'INSERT INTO Customers_Movies (`customer_id`, `movie_id`, `last_watched`) VALUES (?, ?, ?)';
// This query occurs when an attempt is made to insert a duplicate. No new row is added, only last_watched gets updated.
const update_Customers_Movies = 'UPDATE Customers_Movies SET last_watched=? WHERE customer_id=? AND movie_id=?';

// Gets cids emails to populate ratings update in Customers_Movies page
const get_cids_emails_for_Customers_Movies = "SELECT DISTINCT Customers.customer_id, email FROM Customers INNER JOIN Customers_Movies WHERE Customers.customer_id = Customers_Movies.customer_id";
// const get_mids_titles_for_Customers_Movies = "SELECT DISTINCT Customers_Movies.movie_id, title FROM Movies INNER JOIN Customers_Movies WHERE Customers_Movies.customer_id = 2";

// Delete all Customers_Movies and Customers_Shows relations for a customer_id
const delete_customers_movies_from_cid = 'DELETE FROM Customers_Movies WHERE customer_id=?';
const delete_customers_shows_from_cid = 'DELETE FROM Customers_Shows WHERE customer_id=?';
// Set all payments to null for cid
const set_payments_to_null = 'UPDATE Payment_Information SET customer_id=NULL WHERE customer_id=?';
// Delete the customer
const delete_customer = 'DELETE FROM Customers WHERE customer_id=?';

// Home
app.get('/', (req,res) => {
  var context = {};
  context.title = 'Home';
  context.results = 'Test';
  res.render('home',context);
});

// Payment_Information
app.get('/payment_information', (req,res) => {
  var context = {};
  context.title = 'Payment_Information';
  mysql.pool.query('SELECT * FROM Payment_Information', (err, rows, fields) => {
    if(err) {
      next(err);
      return
    }
    context.results = rows;
    res.render('payment_information', context);
  });
});

// Customers Get Request
app.get('/customers', (req,res) => {
  var context = {};
  context.title = 'Customers';
  context.script = 'customers.js';
  mysql.pool.query('SELECT * FROM Customers', (err, rows) => {
    if(err) {
      next(err);
      return
    }
    context.results = rows;
    res.render('customers', context);
  });
});

// Check if the get request contains a customer_id.
// If it does, this query should be for getting Payment_Information, Movies,
// and Shows related to the customer
app.get('/customers/:customer_id', (req,res) => {
  var customer_id = req.params.customer_id;
  mysql.pool.query(get_payment_for_customer, [customer_id], (err, rows) => {
    if(err) {
      next(err);
      return
    }
    res.json({rows:rows});
  });
});

// Updates is_primary, or updates a customer, or updates payment method
app.put('/customers', (req,res) => {
  if ('first_name' in req.body) {
    context = {};
    var { auto_pay, customer_id, first_name, last_name, email } = req.body;
    mysql.pool.query(update_customer, [first_name, last_name, email, auto_pay, customer_id], (err, rows) => {
      if(err) {
        next(err);
        return
      }
      res.json(context);
    });
  }
  else if ('card_first_name' in req.body) {
    context = {};
    var { customer_id, payment_id, card_first_name, card_last_name, billing_address } = req.body;
    mysql.pool.query(update_payment, [card_first_name, card_last_name, billing_address, payment_id], (err, rows) => {
      if(err) {
        next(err);
        return
      }
      // Queries for new payment info for that customer, returns it.
      mysql.pool.query(get_payment_for_customer, [customer_id], (err, rows) => {
        if(err) {
          next(err);
          return
        }
        res.json({rows:rows});
      });
    });
  }
  else {
    // Set the is_primary attribute of the current primary of c_id to 0.
    var { customer_id, payment_id } = req.body;
    mysql.pool.query(set_is_primary_to_false, [customer_id], (err, rows) => {
      if(err) {
        next(err);
        return
      }
      // Set payment with payment_id is_primary to 1
      mysql.pool.query(set_is_primary_to_true, [payment_id], (err, rows) => {
        if(err) {
          next(err);
          return
        }
        // Queries for new payment info for that customer, returns it.
        mysql.pool.query(get_payment_for_customer, [customer_id], (err, rows) => {
          if(err) {
            next(err);
            return
          }
          res.json({rows:rows});
        });
      });
    });
  }
});

// Insert new customer, add payment method, set customer_id as fk on Payment_Information table. OR insert new payment method.
app.post('/customers', (req,res) => {
  var context = {};
  if ('first_name' in req.body) {
    console.log('INSERT to Customers');
    var { first_name, last_name, card_first_name, card_last_name, email, card_number, billing_address } = req.body;
    // Generates date 1 month from now
    var date_until_renew = moment().add(1, 'month').format();
    // Inserts new customer information to Customers table
    mysql.pool.query(
      insert_new_customer,
      [first_name, last_name, email, date_until_renew],
      (err, result) => {
        if(err){
          next(err);
          return;
        }
        // Get ID of latest customer-------------------------------------------------------
        var temp = {};
        var id;
        mysql.pool.query('SELECT MAX(customer_id) FROM Customers', (err, rows, fields) => {
          if(err) {
            next(err);
            return
          }
          temp.payment_id = rows;
          obj = JSON.parse(JSON.stringify(temp.payment_id[0]));
          id = obj[Object.keys(obj)[0]];
          console.log(id);
          // Insert payment method for new customer into Payment_Information
          mysql.pool.query(
            insert_Payment_Information,
            ['1', card_first_name, card_last_name, card_number, billing_address, id],
            (err, result) => {
              if(err){
                next(err);
                return;
              }
              res.json(context);
            }
          );
        });
      }
    );
  } else if (req.body.action == "recently_watched"){
    // Queries for the most recently watched movies and shows for two separate tables.
    var recently_watched_movies_query = 'SELECT Movies.title, Customers_Movies.last_watched FROM Customers_Movies \
    INNER JOIN Movies ON Customers_Movies.movie_id = Movies.movie_id \
    WHERE customer_id = ' + req.body.c_id + ' ORDER BY last_watched ASC LIMIT 20;';

    var recently_watched_shows_query = 'SELECT Shows.title, Customers_Shows.last_watched FROM Customers_Shows \
    INNER JOIN Shows ON Customers_Shows.show_id = Shows.show_id \
    WHERE customer_id = ' + req.body.c_id + ' ORDER BY last_watched ASC LIMIT 20;';
    
    mysql.pool.query(recently_watched_movies_query, function(error, rows){
      if (error){
        throw error;
      };

      context.recent_movies = rows; // Stores recent movies in the payload

      // Since the first query was successful, query the recent shows table
      mysql.pool.query(recently_watched_shows_query, function(error, rows){
        if (error){
          throw error;
        };

        context.recent_shows = rows; // Stores recent shows in the payload

        // Both queries are successful.  Sends data back to client.
        res.json(context);
      });
    });
  } else {
    console.log('INSERT to Payment_Information');
    var { card_first_name, card_last_name, card_number, billing_address, customer_id } = req.body;
    mysql.pool.query(insert_Payment_Information, ['0', card_first_name, card_last_name, card_number, billing_address, customer_id], (err, rows) => {
      if(err) {
        next(err);
        return
      }
      // Queries for new payment info for that customer, returns it.
      mysql.pool.query(get_payment_for_customer, [customer_id], (err, rows) => {
        if(err) {
          next(err);
          return
        }
        res.json({rows:rows});
      });
    });
  }
});

app.delete('/customers', (req,res) => {
  console.log(req.body);

  if ('payment_id' in req.body) {
    var { customer_id, payment_id } = req.body;
    mysql.pool.query('DELETE FROM Payment_Information WHERE payment_id=?', [payment_id], (err, result) => {
      if(err) {
        next(err);
        return
      }
      // Queries for new payment info for that customer, returns it.
      mysql.pool.query(get_payment_for_customer, [customer_id], (err, rows) => {
        if(err) {
          next(err);
          return
        }
        res.json({rows:rows});
      });
    });
  }
  else {
    var { customer_id } = req.body;
    mysql.pool.query(delete_customers_movies_from_cid, [customer_id], (err, result) => {
      if(err) {
        next(err);
        return
      }
      // Queries for new payment info for that customer, returns it.
      mysql.pool.query(delete_customers_shows_from_cid, [customer_id], (err, rows) => {
        if(err) {
          next(err);
          return
        }
        mysql.pool.query(set_payments_to_null, [customer_id], (err, rows) => {
          if(err) {
            next(err);
            return
          }
          mysql.pool.query(delete_customer, [customer_id], (err, rows) => {
            if(err) {
              next(err);
              return
            }
            res.json({});
          });
        });
      });
    });
  }
});

// Movies - Page Load
app.get('/movies', (req,res) => {
  var context = {};
  context.title = 'Movies';
  context.results = 'Test';
  context.script = 'movies.js';
  context.movies = []; // Movie database entry objects

  mysql.pool.query("SELECT * FROM Movies", function(error, result, fields){
    // Is there a query error?
    if (error){
      throw error;
    };

    // Converting entry attributes happen here
    for (i in result) {
      context.movies.push(result[i]);
    }

    res.render('movies', context); // Renders after query finishes
  });  
});

// Movies - Filter, Insert, or Update request
app.post('/movies', (req,res)=>{
  // Convert JSON data to Java object
  var entry = req.body;
  console.log(">> client request body parsed by server <<");
  console.log(entry.request);

  // Checks the request body for what type of operation the client wants to do.
  if (entry.request == "filter")
  {
    filter_movies();
  } else if (entry.request == "update"){
    edit_movie();
  } else if (entry.request == "add"){
    add_movie();
  }

  function filter_movies(){
    // Form the SELECT query to find the specific entries.
    var select_query = "";
    var is_first = true; // Determines if AND should be used before it.
    if (entry.movie_id != ""){
      select_query += "WHERE movie_id = " + entry.movie_id;
      is_first = false;
    };
    if (entry.title != ""){
      if (is_first == true){
        select_query += "WHERE title = '" + entry.title + "'";
        is_first = false;
      } else {
        select_query += " AND title = '" + entry.title + "'";
      };
    };
    if (entry.genre != ""){
      if (is_first == true){
        select_query += "WHERE genre = '" + entry.genre + "'";
        is_first = false;
      } else {
        select_query += " AND genre = '" + entry.genre + "'";
      };
    };
    if (entry.runtime != ""){
      if (is_first == true){
        select_query += "WHERE runtime = " + entry.runtime;
        is_first = false;
      } else {
        select_query += " AND runtime = " + entry.runtime;
      };
  };

  select_query = "SELECT * FROM Movies " + select_query;

  console.log(select_query);

  // Sends the query
  mysql.pool.query(select_query, function(error, entries, fields){
    if (error){
      throw error;
    };
    res.json(entries); // Sends filtered table entries to client.
  });
  }

  function edit_movie(){
    // Form the SELECT query to find the specific entries.
    var update_query = "";
    var is_first = true; // Determines if AND should be used before it.
    
    if (entry.movie_id != ""){
      update_query += "SET movie_id = " + entry.movie_id;
      is_first = false;
    };

    if (entry.title != ""){
      if (is_first == true){
        update_query += "SET title = '" + entry.title + "'";
        is_first = false;
      } else {
        update_query += ", title = '" + entry.title + "'";
      };
    };

    if (entry.genre != ""){
      if (is_first == true){
        update_query += "SET genre = '" + entry.genre + "'";
        is_first = false;
      } else {
        update_query += ", genre = '" + entry.genre + "'";
      };
    };

    if (entry.runtime != ""){
      if (is_first == true){
        update_query += "SET runtime = " + entry.runtime;
        is_first = false;
      } else {
        update_query += ", runtime = " + entry.runtime;
      };
    };

    update_query = "UPDATE Movies " + update_query + " WHERE movie_id =" + entry.old_movie_id;

    console.log(update_query);

    // Sends the query
    mysql.pool.query(update_query, function(error, entries, fields){
      if (error){
        throw error;
      };
      res.end(); // Sends nothing back to the client
    });
  }

  function add_movie(){
    // Aborts if any input fields are empty.
    if (entry.title == "" || entry.genre == "" || entry.runtime == ""){
      // Replace this with error handling
      console.log("missing add movie field");
      return;
    }

    // Forms a query using create entry fields
    var insert_query = "INSERT INTO Movies (title, genre, runtime) VALUES ('" + entry.title + "','" + entry.genre + "'," + entry.runtime + ");";
    console.log(insert_query);

    // Queries the database
    mysql.pool.query(insert_query, function(error, entries, fields){
      if (error){
        throw error;
      };
      res.end(); // Sends nothing back to client.
    });
  }
});

// Movies - Delete entry
app.delete('/movies', (req, res, next)=>{
  console.log("Delete request received by server.");
  var entry = req.body; // The id of the row where the button was clicked
  console.log("REQUEST.BODY: " + entry.row_id);

  // Deletes entry if it appears on the Customers_Movies database.
  var delete_customer_movies_query = 'DELETE FROM Customers_Movies WHERE movie_id = ' + entry.row_id;
  mysql.pool.query(delete_customer_movies_query, function(error, result){
    if (error){
      throw error;
    };
  });

  // Deletes entry if it appears on the Movies database.
  var delete_movies_query = 'DELETE FROM Movies WHERE movie_id = ' + entry.row_id;
  mysql.pool.query(delete_movies_query, function(error, result){
    if (error){
      throw error;
    };
    res.end();  // Sends no data back to client.
  });
});



// Customers_Movies
app.get('/customers_movies', (req,res) => {
  var context = {};
  // if ('customer_id' in req.query) {
  //   mysql.pool.query("", function(error, result, fields){
  //     if (error){
  //       throw error;
  //     };
      
  //   });
  // }
  context.title = 'Customers_Movies';
  context.results = 'Test';
  context.script = 'customers_movies.js';
  context.customers_movies = [];

  mysql.pool.query("SELECT customer_id, email FROM Customers", (err, rows) => {
    if(err) {
      next(err);
      return
    }
    context.customers = rows;
    mysql.pool.query("SELECT movie_id, title FROM Movies", (err, rows) => {
      if(err) {
        next(err);
        return
      }
      context.movies = rows;
      mysql.pool.query(get_cids_emails_for_Customers_Movies, (err, rows) => {
        if(err) {
          next(err);
          return
        }
        context.cids_ems = rows;
        mysql.pool.query("SELECT * FROM Customers_Movies", function(error, result, fields){
          // Is there a query error?
          if (error){
            throw error;
          };
          // Converting entry attributes happen here
          for (i in result) {
            context.customers_movies.push(result[i]);
          }
          res.render('customers_movies', context); // Renders after query finishes
        });
      });
    });
  });
});

// Customers_Movies - Delete entry
app.delete('/customers_movies', (req, res, next)=>{
  console.log("Delete request received by server.");
  var entry = req.body; // The id of the row where the button was clicked
  console.log("REQUEST.BODY: " + entry.customer_id + entry.movie_id);

  // Deletes entry if it appears on the Customers_Movies database.
  var delete_customer_movies_query = 'DELETE FROM Customers_Movies WHERE customer_id = ' + entry.customer_id + ' AND movie_id = ' + entry.movie_id;
  mysql.pool.query(delete_customer_movies_query, function(error, result){
    if (error){
      throw error;
    };
    res.end(); // Send no data back to client.
  });
});

// Shows - Page Load
app.get('/shows', (req,res) => {
  var context = {};
  context.title = 'Shows';
  context.results = 'Test';
  res.render('shows',context);
});

// Customers_Movies - Filter/Insert/Update request
app.post('/customers_movies', (req,res)=>{
  if ('MM_customer_id' in req.body) {
    insert_customers_movies();
  } else if (req.body.action == "update"){
    update_customers_movies();
  }
  else {
    filter_customers_movies();
  }

  function insert_customers_movies(){
    var { MM_customer_id, MM_movie_id } = req.body;
    // Generates date 1 month from now
    var last_watched = moment().format();
    // Inserts new customer movie relation

    mysql.pool.query(
      'SELECT * FROM Customers_Movies WHERE customer_id=? AND movie_id=?',
      [MM_customer_id, MM_movie_id],
      (err, result) => {
        if(err){
          next(err);
          return;
        }
        if (!result.length) {
          console.log('Insert')
          mysql.pool.query(
            'INSERT INTO Customers_Movies (`customer_id`, `movie_id`, `last_watched`) VALUES (?, ?, ?)',
            [MM_customer_id, MM_movie_id, last_watched],
            (err, result) => {
              if(err){
                next(err);
                return;
              }
              res.json({});
            }
          );
        }
        else {
          console.log('Update')
          mysql.pool.query(
            'UPDATE Customers_Movies SET last_watched=? WHERE customer_id=? AND movie_id=?',
            [last_watched, MM_customer_id, MM_movie_id],
            (err, result) => {
              if(err){
                next(err);
                return;
              }
              res.json({});
            }
          );
        }
      }
    );
  };

  function filter_customers_movies(){
    // Convert JSON data to Java object
    var entry = req.body;
    console.log(">> client request body parsed by server <<");

    // Form the SELECT query to find the specific entries.
    var select_query = "";
    var is_first = true; // Determines if AND should be used before it.
    if (entry.customer_id != ""){
      select_query += "WHERE customer_id = " + entry.customer_id;
      is_first = false;
    };
    if (entry.movie_id != ""){
      if (is_first == true){
        select_query += "WHERE movie_id = '" + entry.movie_id + "'";
        is_first = false;
      } else {
        select_query += " AND movie_id = '" + entry.movie_id + "'";
      };
    };
    if (entry.last_watched != ""){
      if (is_first == true){
        select_query += "WHERE last_watched = '" + entry.last_watched + "'";
        is_first = false;
      } else {
        select_query += " AND last_watched = '" + entry.last_watched + "'";
      };
    };
    if (entry.rating != ""){
      if (is_first == true){
        select_query += "WHERE rating = " + entry.rating;
        is_first = false;
      } else {
        select_query += " AND rating = " + entry.rating;
      };
    };

    select_query = "SELECT * FROM Customers_Movies " + select_query;

    console.log(select_query);

    // Sends the query
    mysql.pool.query(select_query, function(error, entries, fields){
      if (error){
        throw error;
      };
      res.json(entries); // Sends filtered table entries to client.
    });
  };

  function update_customers_movies(){
    // Form the SELECT query to find the specific entries.
    var update_query = "";
    var is_first = true; // Determines if AND should be used before it.
    
    var entry = req.body;

    if (entry.movie_id != ""){
      update_query += "SET movie_id = " + entry.movie_id;
      is_first = false;
    };

    update_query = "UPDATE Customers_Movies SET rating = " + entry.rating +
      " WHERE customer_id = " + entry.customer_id + " AND movie_id = " + entry.movie_id;

    console.log(update_query);

    // Sends the query
    mysql.pool.query(update_query, function(error, entries, fields){
      if (error){
        throw error;
      };
      res.end(); // Sends nothing back to the client
    });
  };
});

// Customers_Shows
app.get('/customers_shows', (req,res) => {
  var context = {};
  context.title = 'Customers_Shows';
  context.results = 'Test';
  res.render('customers_shows',context);
});

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(error, req, res, next){
  console.error(error.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
