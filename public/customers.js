const baseURL = `http://localhost:3000/`;

// ANC = Add New Customer-----------------------------------------------------------------------------
document.querySelector('.ANC_form').onsubmit = (event) => {
    var formData = get_ANC_form_data();
    console.log(formData);

    var req = new XMLHttpRequest();
    req.open('POST', baseURL + 'customers');
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', () => {
        window.location.reload();
    });
    req.send(JSON.stringify(formData));
    event.preventDefault();
}

function get_ANC_form_data() {
    var street = document.getElementById('ANC_street').value;
    var city = document.getElementById('ANC_city').value;
    var state = document.getElementById('ANC_state').value;
    var zip = document.getElementById('ANC_zip').value;
    var full_address = street + ', ' + city + ', ' + state + ' ' + zip;
    
    var formData = {};
    formData["first_name"] = document.getElementById('fName').value;
    formData["last_name"] = document.getElementById('lName').value;
    formData["card_first_name"] = document.getElementById('card_fName').value;
    formData["card_last_name"] = document.getElementById('card_lName').value;
    formData["email"] = document.getElementById('mail').value;
    formData["card_number"] = document.getElementById('cNum').value;
    formData["billing_address"] = full_address;
    return formData;
}

// Customers table buttons-----------------------------------------------------------------------------
document.querySelector('.Customers_tbody').addEventListener('click', (event) => {
    if (event.target.tagName.toLowerCase() === 'button') {
        if (event.target.innerHTML === 'Details') {
            // In the case that the user clicks on details before submitting the payment update form
            remove_payment_update_form();            

            // Get customer_id, first_name, last_name of row button that was clicked
            var row = event.target.parentElement.parentElement;
            var c_id = row.firstElementChild.innerHTML;
            var full_name = row.childNodes[3].innerHTML + ' ' + row.childNodes[5].innerHTML;
            console.log('customer_id:', c_id);
            
            // Fill the spans
            document.getElementById('id_span').innerText = c_id;
            document.getElementById('name_span').innerText = full_name;

            var payment_tbody = document.querySelector('.payment_tbody');
            var req = new XMLHttpRequest();
            req.open('GET', baseURL + 'customers/' + c_id);
            req.addEventListener('load', () => {
                var response = JSON.parse(req.responseText);
                var response_array = response.rows;
                console.log('array_of_payment_info:', response_array);

                generate_add_new_payment_button();
                // Clear client specific payments table
                clear_payment_tbody();
                make_payment_table(response_array, payment_tbody);
                generate_recently_watched_tables(c_id);
            });
            req.send();
        }
        else if (event.target.innerHTML === 'Update') {
            // Get customer_id, first_name, last_name of row button that was clicked
            var row = event.target.parentElement.parentElement;
            var c_id = row.firstElementChild.innerHTML;
            var f_name = row.firstElementChild.nextElementSibling.innerHTML;
            var l_name = row.firstElementChild.nextElementSibling.nextElementSibling.innerHTML;
            var email = row.firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML;
            var auto = row.firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML;

            var pre_data = {};
            pre_data['customer_id'] = c_id;
            pre_data['first_name'] = f_name;
            pre_data['last_name'] = l_name;
            pre_data['email'] = email;
            pre_data['auto_pay'] = auto;

            console.log(pre_data);

            generate_update_Customer_form(pre_data);
        }
        else if (event.target.innerHTML === 'Delete') {
            var row = event.target.parentElement.parentElement;
            var c_id = row.firstElementChild.innerHTML;
            var reqBody = {};
            reqBody['customer_id'] = c_id;
            var req = new XMLHttpRequest();
            req.open('DELETE', baseURL + 'customers')
            req.setRequestHeader('Content-Type', 'application/json');
            req.addEventListener('load', () => {
                window.location.reload();
            });
            req.send(JSON.stringify(reqBody));
        }
    }
});

// Generate add payment button
function generate_add_new_payment_button() {
    var insert_payment_form = document.querySelector('#insert_payment_form');
    insert_payment_form.innerHTML = '';
    var button = document.createElement('button');
    button.innerHTML = 'Insert New Payment Method';
    insert_payment_form.appendChild(button);
}

// Add buttons functionalities for inserting payment--------------------------------------------SFGHH65H456HDRTHDFGHRHE56HGHDHG----------------------------------------------AIERFOJWERTJE9RGJ9U
document.querySelector('#insert_payment_form').addEventListener('click', (event) => {
    if (event.target.tagName.toLowerCase() === 'button') {
        if (event.target.innerHTML === 'Insert New Payment Method') {
            pre_data = {}
            pre_data['customer_id'] = document.getElementById('id_span').innerText;
            generate_insert_payment_form(pre_data);
        }
        else if (event.target.innerHTML === 'Cancel') {
            generate_add_new_payment_button();
        }
    }
    else if (event.target.type === 'submit') {
        var payment_tbody = document.querySelector('.payment_tbody');
        var reqBody = get_IP_form_data();
        console.log(reqBody);
        var req = new XMLHttpRequest();
        req.open('POST', baseURL + 'customers')
        req.setRequestHeader('Content-Type', 'application/json');
        req.addEventListener('load', () => {
            var response = JSON.parse(req.responseText);
            var response_array = response.rows;
            generate_add_new_payment_button();
            // Clear client specific payments table
            clear_payment_tbody();
            make_payment_table(response_array, payment_tbody);
        });
        req.send(JSON.stringify(reqBody));
    }
});

// get insert data for payment from form
function get_IP_form_data() {
    var street = document.getElementById('IP_street').value;
    var city = document.getElementById('IP_city').value;
    var state = document.getElementById('IP_state').value;
    var zip = document.getElementById('IP_zip').value;
    var full_address = street + ', ' + city + ', ' + state + ' ' + zip;
    
    var formData = {};
    formData['customer_id'] = document.getElementById('IP_cid_span').innerText;
    formData['card_first_name'] = document.getElementById('IP_first_name').value;
    formData['card_last_name'] = document.getElementById('IP_last_name').value;
    formData['card_number'] = document.getElementById('IP_card_number').value;
    formData['billing_address'] = full_address;
    return formData;
}

// Generate form to insert new payment_method
function generate_insert_payment_form(existing_data) {
    var form_div = document.getElementById('insert_payment_form');
    form_div.innerHTML = '';

    cid_span = document.createElement('span');
    cid_span.innerText = existing_data.customer_id;
    cid_span.id = 'IP_cid_span';
    cid_span.hidden = true;
    form_div.appendChild(cid_span);

    var form = document.createElement('form');
    form.setAttribute('autocomplete', 'off');
    form.setAttribute('onsubmit', 'event.preventDefault();');

    var fieldset = document.createElement('fieldset');
    var legend = document.createElement('legend');
    legend.innerText = 'Payment Insert Form';

    var f_name_label = document.createElement('label');
    f_name_label.innerText = 'First Name:';
    var f_name_input = document.createElement('input');
    f_name_input.type = 'text';
    f_name_input.name = 'first_name';
    f_name_input.id = 'IP_first_name';
    f_name_input.required = true;

    var l_name_label = document.createElement('label');
    l_name_label.innerText = 'Last Name:';
    var l_name_input = document.createElement('input');
    l_name_input.type = 'text';
    l_name_input.name = 'last_name';
    l_name_input.id = 'IP_last_name';
    l_name_input.required = true;


    var div1 = document.createElement('div');
    div1.appendChild(f_name_label);
    div1.appendChild(f_name_input);
    div1.appendChild(l_name_label);
    div1.appendChild(l_name_input);

    var cnum_label = document.createElement('label');
    cnum_label.innerText = 'Card Number:';
    var cnum_input = document.createElement('input');
    cnum_input.type = 'text';
    cnum_input.name = 'card_number';
    cnum_input.id = 'IP_card_number';
    cnum_input.required = true;


    var div0 = document.createElement('div');
    div0.appendChild(cnum_label);
    div0.appendChild(cnum_input);

    var street_label = document.createElement('label');
    street_label.innerText = 'Street Address:';
    var street_input = document.createElement('input');
    street_input.type = 'text';
    street_input.name = 'street';
    street_input.id = 'IP_street';
    street_input.required = true;

    var city_label = document.createElement('label');
    city_label.innerText = 'City:';
    var city_input = document.createElement('input');
    city_input.type = 'text';
    city_input.name = 'city';
    city_input.id = 'IP_city';
    city_input.required = true;

    var state_label = document.createElement('label');
    state_label.innerText = 'State:';
    var state_input = document.createElement('input');
    state_input.type = 'text';
    state_input.name = 'state';
    state_input.id = 'IP_state';
    state_input.required = true;

    var zip_label = document.createElement('label');
    zip_label.innerText = 'Zip:';
    var zip_input = document.createElement('input');
    zip_input.type = 'text';
    zip_input.name = 'zip';
    zip_input.id = 'IP_zip';
    zip_input.required = true;

    var div2 = document.createElement('div');
    div2.appendChild(street_label);
    div2.appendChild(street_input);
    div2.appendChild(city_label);
    div2.appendChild(city_input);
    div2.appendChild(state_label);
    div2.appendChild(state_input);
    div2.appendChild(zip_label);
    div2.appendChild(zip_input);

    var submit_button = document.createElement('input');
    submit_button.type = 'submit';

    var cancel_button = document.createElement('button');
    cancel_button.innerHTML = 'Cancel';

    var div3 = document.createElement('div');
    div3.appendChild(cancel_button);
    div3.appendChild(submit_button);
    
    fieldset.appendChild(legend);
    fieldset.appendChild(div1);
    fieldset.appendChild(div0);
    fieldset.appendChild(div2);
    fieldset.appendChild(div3);
    form.appendChild(fieldset);
    form_div.appendChild(form);
}

// generate_update_Customer_form. Pass object containing, customer_id, first_name, last_name, email, auto_pay before update.
function generate_update_Customer_form(existing_data) {
    var form_div = document.getElementById('update_Customers_form');
    form_div.innerHTML = '';
    // ----------------------------------------------------------
    var form_header = document.createElement('h6');
    form_header.innerText = 'Update Customer'
    form_div.appendChild(form_header);
    // ----------------------------------------------------------
    var cid_span = document.createElement('span');
    cid_span.innerText = existing_data.customer_id;
    cid_span.id = 'cid_span';
    cid_span.hidden = true;
    form_div.appendChild(cid_span);
    // ----------------------------------------------------------
    var form = document.createElement('form');
    form.setAttribute('autocomplete', 'off');
    form.setAttribute('onsubmit', 'event.preventDefault();');
    // ----------------------------------------------------------
    var div0 = document.createElement('div');
    div0.classList.add('form-group');
    var f_name_label = document.createElement('label');
    f_name_label.innerText = 'First Name:';
    f_name_label.htmlFor = 'UC_first_name';
    var f_name_input = document.createElement('input');
    f_name_input.type = 'text';
    f_name_input.classList.add('form-control');
    f_name_input.id = 'UC_first_name';
    f_name_input.value = existing_data.first_name;
    f_name_input.required = true;
    div0.appendChild(f_name_label);
    div0.appendChild(f_name_input);
    // ----------------------------------------------------------
    var div1 = document.createElement('div');
    div1.classList.add('form-group');
    var l_name_label = document.createElement('label');
    l_name_label.innerText = 'Last Name:';
    l_name_label.htmlFor = 'UC_last_name';
    var l_name_input = document.createElement('input');
    l_name_input.type = 'text';
    l_name_input.classList.add('form-control');
    l_name_input.id = 'UC_last_name';
    l_name_input.value = existing_data.last_name;
    l_name_input.required = true;
    div1.appendChild(l_name_label);
    div1.appendChild(l_name_input);
    // ----------------------------------------------------------
    var div2 = document.createElement('div');
    div2.classList.add('form-group');
    var email_label = document.createElement('label');
    email_label.innerText = 'Email Address:';
    email_label.htmlFor = 'UC_email';
    var email_input = document.createElement('input');
    email_input.type = 'email';
    email_input.classList.add('form-control');
    email_input.id = 'UC_email';
    email_input.value = existing_data.email;
    email_input.required = true;
    div2.appendChild(email_label);
    div2.appendChild(email_input);
    // ----------------------------------------------------------
    var div3 = document.createElement('div');
    div3.classList.add('form-group');
    div3.classList.add('form-check');
    var auto_label = document.createElement('label');
    auto_label.classList.add('form-check-label');
    auto_label.htmlFor = 'UC_auto_checkbox';
    auto_label.innerText = 'Enable Auto-Pay?';
    var auto_input = document.createElement('input');
    auto_input.type = 'checkbox';
    auto_input.classList.add('form-check-input');
    auto_input.id = 'UC_auto_checkbox';
    if (existing_data.auto_pay === '1') {
        auto_input.checked = true;
    }
    else auto_input.checked = false;
    div3.appendChild(auto_input);
    div3.appendChild(auto_label);
    // ----------------------------------------------------------
    var submit_button = document.createElement('button');
    submit_button.classList.add('btn');
    submit_button.classList.add('btn-primary');
    submit_button.innerHTML = 'Submit'
    submit_button.id = 'submit_update';
    // ----------------------------------------------------------
    var cancel_button = document.createElement('button');
    cancel_button.classList.add('btn');
    cancel_button.classList.add('btn-secondary');
    cancel_button.innerHTML = 'Cancel';
    cancel_button.id = 'cancel_update';
    // ----------------------------------------------------------
    form.appendChild(div0);
    form.appendChild(div1);
    form.appendChild(div2);
    form.appendChild(div3);
    form.appendChild(submit_button);
    form.appendChild(cancel_button);
    form_div.appendChild(form);
}

// Get update-customer form data-----------------------------------------------------------------------------
function get_UC_form_data() {
    var formData = {};
    formData['first_name'] = document.getElementById('UC_first_name').value;
    formData['last_name'] = document.getElementById('UC_last_name').value;
    formData['email'] = document.getElementById('UC_email').value;
    formData['auto_pay'] = document.getElementById('UC_auto_checkbox').checked;
    formData['customer_id'] = document.getElementById('cid_span').innerText;
    return formData;
}

// Update-customers form button functionality-----------------------------------------------------------------------------
document.getElementById('update_Customers_form').addEventListener('click', (event) => {
    if (event.target.id === 'submit_update') {
        var reqBody = get_UC_form_data();
        var req = new XMLHttpRequest();
        req.open('PUT', baseURL + 'customers');
        req.setRequestHeader('Content-Type', 'application/json');
        req.addEventListener('load', () => {
            window.location.reload();
        });
        req.send(JSON.stringify(reqBody));
    }
    else if (event.target.id === 'cancel_update') {
        document.getElementById('update_Customers_form').innerHTML = '';
    }
});

// Make Payment Table. Takes in as parameters, an array of rows where each row is an object, and a tbody element
function make_payment_table(array_of_rows, tbody) {
    for (i=0; i<array_of_rows.length; i++) {
        // New row
        var row = document.createElement('tr');
        tbody.appendChild(row);
        
        // Table data
        var row_head = document.createElement('th');
        row_head.setAttribute('scope', 'row');
        row_head.innerText = array_of_rows[i].payment_id;
        row.appendChild(row_head);

        var td_is_primary = document.createElement('td');
        td_is_primary.innerText = array_of_rows[i].is_primary;
        row.appendChild(td_is_primary);

        var td_first_name = document.createElement('td');
        td_first_name.innerText = array_of_rows[i].first_name;
        row.appendChild(td_first_name);

        var td_last_name = document.createElement('td');
        td_last_name.innerText = array_of_rows[i].last_name;
        row.appendChild(td_last_name);

        var td_card_number = document.createElement('td');
        td_card_number.innerText = array_of_rows[i].card_number;
        row.appendChild(td_card_number);

        var td_billing_address = document.createElement('td');
        td_billing_address.innerText = array_of_rows[i].billing_address;
        row.appendChild(td_billing_address);

        var td_customer_id = document.createElement('td');
        td_customer_id.innerText = array_of_rows[i].customer_id;
        td_customer_id.hidden = true;
        row.appendChild(td_customer_id);

        // Buttons
        var td_update = document.createElement('td');
        row.appendChild(td_update);
        var update_button = document.createElement('button');
        update_button.setAttribute('type', 'button');
        update_button.setAttribute('class', 'btn btn-primary btn-sm');
        update_button.innerHTML = 'Update';
        td_update.appendChild(update_button);

        var td_set_primary = document.createElement('td');
        row.appendChild(td_set_primary);
        var set_primary_button = document.createElement('button');
        set_primary_button.setAttribute('type', 'button');
        set_primary_button.setAttribute('class', 'btn btn-primary btn-sm');
        set_primary_button.innerHTML = 'Set Primary';
        td_set_primary.appendChild(set_primary_button);

        var td_delete = document.createElement('td');
        row.appendChild(td_delete);
        var delete_button = document.createElement('button');
        delete_button.setAttribute('type', 'button');
        delete_button.setAttribute('class', 'btn btn-secondary btn-sm');
        delete_button.innerHTML = 'Delete';
        td_delete.appendChild(delete_button);
    }
}

// Payments table buttons-----------------------------------------------------------------------------
document.querySelector('.payment_tbody').addEventListener('click', (event) => {
    if (event.target.tagName.toLowerCase() === 'button') {
        var payment_tbody = document.querySelector('.payment_tbody');
        
        var row = event.target.parentElement.parentElement;
        // customer_id of row, from span. payment_id of row, first name, last name, address
        var c_id = document.getElementById('id_span').innerText;
        var p_id = row.firstElementChild.innerHTML;
        var is_p = row.firstElementChild.nextElementSibling.innerHTML;
        var f_name = row.firstElementChild.nextElementSibling.nextElementSibling.innerHTML;
        var l_name = row.firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML;
        var b_address = row.firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML;
        var b_address_array = b_address.split(',');
        var street = b_address_array[0];
        var city = b_address_array[1].trim();
        var zip = b_address_array[2].slice(-5);
        var state = b_address_array[2].slice(0,-5).trim();
        
        if (event.target.innerHTML === 'Set Primary') {
            var reqBody = {};
            reqBody['customer_id'] = c_id;
            reqBody['payment_id'] = p_id;
            console.log(reqBody);
            // PUT request. Set the is_primary attribute of the current primary of c_id to 0.
            // Follows with updating 'is_primary' attribute of new p_id.
            var req = new XMLHttpRequest();
            req.open('PUT', baseURL + 'customers');
            req.setRequestHeader('Content-Type', 'application/json');
            req.addEventListener('load', () => {
                var response = JSON.parse(req.responseText);
                var response_array = response.rows;
                // Clear client specific payments table
                clear_payment_tbody();
                make_payment_table(response_array, payment_tbody);
            });
            req.send(JSON.stringify(reqBody));
        }
        else if (event.target.innerHTML === 'Update') {
            var pre_data = {};
            pre_data['customer_id'] = c_id;
            pre_data['payment_id'] = p_id;
            pre_data['card_first_name'] = f_name;
            pre_data['card_last_name'] = l_name;
            pre_data['street'] = street;
            pre_data['city'] = city;
            pre_data['state'] = state;
            pre_data['zip'] = zip;
            // console.log(b_address_array);
            console.log(pre_data);
            generate_payment_update_form(pre_data);
        }
        else if (event.target.innerHTML === 'Delete') {
            if (is_p === '0') {
                var reqBody = {};
                reqBody['customer_id'] = c_id;
                reqBody['payment_id'] = p_id;
                var req = new XMLHttpRequest();
                req.open('DELETE', baseURL + 'customers')
                req.setRequestHeader('Content-Type', 'application/json');
                req.addEventListener('load', () => {
                    var response = JSON.parse(req.responseText);
                    var response_array = response.rows;
                    clear_payment_tbody();
                    make_payment_table(response_array, payment_tbody);
                });
                req.send(JSON.stringify(reqBody));
            }
            else if (is_p === '1') {
                alert('Cannot delete payment method if is_primary.');
            }
        }
    }
});

function clear_payment_tbody() {
    var payment_tbody = document.querySelector('.payment_tbody');
    payment_tbody.innerHTML = '';
}

function remove_payment_update_form() {
    var UP_form = document.getElementById('update_payment_form');
    UP_form.innerHTML = '';
}

function generate_payment_update_form(existing_data) {
    var form_div = document.getElementById('update_payment_form');
    form_div.innerHTML = '';

    cid_span = document.createElement('span');
    cid_span.innerText = existing_data.customer_id;
    cid_span.id = 'UP_cid_span';
    cid_span.hidden = true;
    form_div.appendChild(cid_span);
    
    pid_span = document.createElement('span');
    pid_span.innerText = existing_data.payment_id;
    pid_span.id = 'pid_span';
    pid_span.hidden = true;
    form_div.appendChild(pid_span);

    var form = document.createElement('form');
    form.setAttribute('autocomplete', 'off');
    form.setAttribute('onsubmit', 'event.preventDefault();');

    var fieldset = document.createElement('fieldset');
    var legend = document.createElement('legend');
    legend.innerText = 'Payment Update Form';

    var f_name_label = document.createElement('label');
    f_name_label.innerText = 'First Name:';
    var f_name_input = document.createElement('input');
    f_name_input.type = 'text';
    f_name_input.name = 'first_name';
    f_name_input.id = 'UP_first_name';
    f_name_input.value = existing_data.card_first_name;
    f_name_input.required = true;

    var l_name_label = document.createElement('label');
    l_name_label.innerText = 'Last Name:';
    var l_name_input = document.createElement('input');
    l_name_input.type = 'text';
    l_name_input.name = 'last_name';
    l_name_input.id = 'UP_last_name';
    l_name_input.value = existing_data.card_last_name;
    l_name_input.required = true;

    var div1 = document.createElement('div');
    div1.appendChild(f_name_label);
    div1.appendChild(f_name_input);
    div1.appendChild(l_name_label);
    div1.appendChild(l_name_input);

    var street_label = document.createElement('label');
    street_label.innerText = 'Street Address:';
    var street_input = document.createElement('input');
    street_input.type = 'text';
    street_input.name = 'street';
    street_input.id = 'UP_street';
    street_input.value = existing_data.street;
    street_input.required = true;

    var city_label = document.createElement('label');
    city_label.innerText = 'City:';
    var city_input = document.createElement('input');
    city_input.type = 'text';
    city_input.name = 'city';
    city_input.id = 'UP_city';
    city_input.value = existing_data.city;
    city_input.required = true;

    var state_label = document.createElement('label');
    state_label.innerText = 'State:';
    var state_input = document.createElement('input');
    state_input.type = 'text';
    state_input.name = 'state';
    state_input.id = 'UP_state';
    state_input.value = existing_data.state;
    state_input.required = true;

    var zip_label = document.createElement('label');
    zip_label.innerText = 'Zip:';
    var zip_input = document.createElement('input');
    zip_input.type = 'text';
    zip_input.name = 'zip';
    zip_input.id = 'UP_zip';
    zip_input.value = existing_data.zip;
    zip_input.required = true;

    var div2 = document.createElement('div');
    div2.appendChild(street_label);
    div2.appendChild(street_input);
    div2.appendChild(city_label);
    div2.appendChild(city_input);
    div2.appendChild(state_label);
    div2.appendChild(state_input);
    div2.appendChild(zip_label);
    div2.appendChild(zip_input);

    var submit_button = document.createElement('input');
    submit_button.type = 'submit';
    submit_button.id = 'UP_submit_update';

    var cancel_button = document.createElement('button');
    cancel_button.innerHTML = 'Cancel';
    cancel_button.id = 'UP_cancel_update';

    var div3 = document.createElement('div');
    div3.appendChild(cancel_button);
    div3.appendChild(submit_button);
    
    fieldset.appendChild(legend);
    fieldset.appendChild(div1);
    fieldset.appendChild(div2);
    fieldset.appendChild(div3);
    form.appendChild(fieldset);
    form_div.appendChild(form);
}

function get_UP_form_data() {
    var street = document.getElementById('UP_street').value;
    var city = document.getElementById('UP_city').value;
    var state = document.getElementById('UP_state').value;
    var zip = document.getElementById('UP_zip').value;
    var full_address = street + ', ' + city + ', ' + state + ' ' + zip;
    
    var formData = {};
    formData['customer_id'] = document.getElementById('UP_cid_span').innerText;
    formData['payment_id'] = document.getElementById('pid_span').innerText;
    formData['card_first_name'] = document.getElementById('UP_first_name').value;
    formData['card_last_name'] = document.getElementById('UP_last_name').value;
    formData['billing_address'] = full_address;
    return formData;
}

// Update-payment form button functionality-----------------------------------------------------------------------------
document.getElementById('update_payment_form').addEventListener('click', (event) => {
    if (event.target.id === 'UP_submit_update') {
        var payment_tbody = document.querySelector('.payment_tbody');
        reqBody = get_UP_form_data();
        var req = new XMLHttpRequest();
        req.open('PUT', baseURL + 'customers');
        req.setRequestHeader('Content-Type', 'application/json');
        req.addEventListener('load', () => {
            var response = JSON.parse(req.responseText);
            var response_array = response.rows;
            remove_payment_update_form();
            clear_payment_tbody();
            make_payment_table(response_array, payment_tbody);
        });
        req.send(JSON.stringify(reqBody));
    }
    else if (event.target.id === 'UP_cancel_update') {
        remove_payment_update_form();
    }
});

// Generates the recently watched movies and shows tables when Details button is clicked.  C_id is related customer id
function generate_recently_watched_tables(c_id){
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", baseURL + 'customers', true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.addEventListener("load", function(){
        if(xhttp.status >= 200 && xhttp.status < 400){
            // Generate movies and shows table
            var recent_movies_shows = JSON.parse(xhttp.response);
            console.log("Recent movies/shows can be generated!");
            var div_recently_watched = document.getElementById("div_recently_watched");
            div_recently_watched.innerHTML = ""; // Wipes the primary container in-case details is clicked again
            
            // Generates the recent movies table
            // Table
            var table_recent_movies = document.createElement("table");
            div_recently_watched.append(table_recent_movies);
            table_recent_movies.className = "table table-sm table-striped table-dark";
            // Thead
            var thead_recent_movies = document.createElement("thead");
            table_recent_movies.append(thead_recent_movies);
            thead_recent_movies.innerHTML = "<tr><td>Movie Title</td><td>Last Watched</td></tr>";
            // Tbody
            var tbody_recent_movies = document.createElement("tbody");
            table_recent_movies.append(tbody_recent_movies);
            
            var recent_movies = recent_movies_shows.recent_movies; // Grabs only recent movies from response
            for (i=0; i < recent_movies.length; i++){
                // New row
                var new_row = document.createElement("tr");
                tbody_recent_movies.appendChild(new_row);

                // Table data
                var td_movie_title = document.createElement("td");
                new_row.appendChild(td_movie_title);
                td_movie_title.innerHTML = recent_movies[i].title.toString();

                var td_movie_last_watched = document.createElement("td");
                new_row.appendChild(td_movie_last_watched);
                td_movie_last_watched.innerHTML = recent_movies[i].last_watched.toString();
            }

            // Generates the recent shows table
            // Table
            var table_recent_shows = document.createElement("table");
            div_recently_watched.append(table_recent_shows);
            table_recent_shows.className = "table table-sm table-striped table-dark";
            // Thead
            var thead_recent_shows = document.createElement("thead");
            table_recent_shows.append(thead_recent_shows);
            thead_recent_shows.innerHTML = "<tr><td>Show Title</td><td>Last Watched</td></tr>";
            // Tbody
            var tbody_recent_shows = document.createElement("tbody");
            table_recent_shows.append(tbody_recent_shows);
            
            var recent_shows = recent_movies_shows.recent_shows; // Grabs only recent shows from response
            console.log(recent_shows.length);
            for (i=0; i < recent_shows.length; i++){
                // New row
                var new_row = document.createElement("tr");
                tbody_recent_shows.appendChild(new_row);

                // Table data
                var td_show_title = document.createElement("td");
                new_row.appendChild(td_show_title);
                td_show_title.innerHTML = recent_shows[i].title.toString();

                var td_show_last_watched = document.createElement("td");
                new_row.appendChild(td_show_last_watched);
                td_show_last_watched.innerHTML = recent_shows[i].last_watched.toString();
            }
            
        }
    });

    // Grabs values from targeted customer row and stores them into a JSON object.
    var content = {};
    content.action = "recently_watched";
    content.c_id = c_id;  

    // Sends the filter request
    xhttp.send(JSON.stringify(content));
    event.preventDefault();
}
