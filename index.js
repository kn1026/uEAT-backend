
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const stripe = require("stripe")("sk_live_MOC1tbrlvBZENX8WMEXiLhla");
var app = express();
const PORT = process.env.PORT || 5000;
const install = require('yarn-install')
const accountSid = 'ACf08189c86158469eb5e6e438b1798005';
const authToken = '414e47c782c629786358e791f67e1463';
const client = require('twilio')(accountSid, authToken);
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const http = require('http');
const https = require('https');
const request = require('request');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var Checkr = new XMLHttpRequest();
const btoa = function(str){ return Buffer.from(str).toString('base64'); }
const checkr_secret_key = "77a2877369d9ebaf2753ad7c93ec585926ad8426";

var Checkr = {
  rootUrl: 'https://api.checkr.com',
  timeout: 30000,
  publishableKey: null,
  setPublishableKey: function(key) {
    this.publishableKey = key;
  },

  post: function(path, data, callback) {
    var xhr = new XMLHttpRequest();
    var url = Checkr.rootUrl + path;
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-User-Agent', 'Checkr.2.0.0.js');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(Checkr.publishableKey));
    xhr.onreadystatechange = function () {
      try {
        var jsonResponse = JSON.parse(xhr.responseText);
      } catch (e) {
        var jsonResponse = { text: xhr.responseText };
      }

      callback(xhr.status, jsonResponse);
    };
    var dataJSONString = JSON.stringify(data);
    xhr.send(dataJSONString);
  },

  candidate: {
    isSSNValid: function(ssn) {
      if (!ssn) return false;
      return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
    },

    isFirstNameValid: function(firstName) {
      if (!firstName) return false;
      return (/\w{2,}/.test(firstName));
    },

    isLastNameValid: function(lastName) {
      if (!lastName) return false;
      return (/\w{2,}/.test(lastName));
    },

    isPhoneValid: function(phone) {
      if (!phone) return false;
      return phone.match(/\d/g).length === 10;
    },

    isEmailValid: function(email) {
      if (!email) return false;
      return (/^[^@<\s>]+@[^@<\s>]+$/.test(email));
    },

    isMiddleNameEmpty: function(middleName) {
      return !middleName || !(/\w{1,}/.test(middleName));
    },

    isMiddleNameValid: function(middleName, noMiddleName) {
      if (noMiddleName) {
        return this.isMiddleNameEmpty(middleName) === true;
      } else {
        return this.isMiddleNameEmpty(middleName) === false;
      }
    },

    validate: function (candidateData) {
      var requiredKeys = ['first_name', 'last_name', 'ssn', 'email', 'phone'];
      var errors = [];

      for (var i = 0; i < requiredKeys.length; i++) {
        var key = requiredKeys[i];
        if (!candidateData || !(key in candidateData) || !candidateData[key]) {
          errors.push(key + ' is missing');
        }
      }

      if (!this.isSSNValid(candidateData.ssn)) {
        errors.push('invalid ssn');
      }
      if (!this.isFirstNameValid(candidateData.first_name)) {
        errors.push('invalid first name');
      }
      if (!this.isLastNameValid(candidateData.last_name)) {
        errors.push('invalid last name');
      }
      if (!this.isPhoneValid(candidateData.phone)) {
        errors.push('invalid phone');
      }
      if (!this.isEmailValid(candidateData.email)) {
        errors.push('invalid email');
      }
      if (!this.isMiddleNameValid(candidateData.middle_name, candidateData.no_middle_name)) {
        errors.push('invalid middle name');
      }

      return errors;
    },

    create: function (data, callback) {
      if (!Checkr.publishableKey) {
        throw new Error('No Publishable Key set. Use Checkr.setPublishableKey("YOUR_KEY_HERE").')
      }

      if (!data) {
        var message = 'No data supplied';

        if (!callback) {
          throw message;
        } else {
          callback(400, {
            error: message
          });
        }
        return;
      }
      var errors = this.validate(data);

      if (errors.length > 0) {
        callback(400, { error: errors.join(', ') });
      } else {
        Checkr.post('/js/candidates', data, callback);
      }
    }
  },


  screenings: {

    ssn_trace: function (data, callback) {
      if (!Checkr.publishableKey) {
        throw new Error('No secret Key set.')
      }

      if (!data) {
        var message = 'No data supplied';

        if (!callback) {
          throw message;
        } else {
          callback(400, {
            error: message
          });
        }
        return;
      };
      console.log(data)
      Checkr.post('/v1/reports', data, callback);

    }
  },


};


app.use(bodyParser.json());
app.use(bodyParser.urlencoded ({
      extended : true
  }));

app.use(express.static(__dirname + 'public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


app.post('/customers', (req, res) => {

    var email = req.body.email

    stripe.customers.create({
      email: email
    }, function(err, customer) {
      // asynchronously called
      if(err != null) {

        console.log(err)

      }
      res.send(customer)
    })

});

app.post('/customers_card', (req, res) => {

    var id = req.body.cus_id


    stripe.customers.listCards(id, function(err, cards) {

      if(err != null) {

        console.log(err)

      }
      res.send(cards)

  });



});

app.post('/customers_email_update', (req, res) => {

    var id = req.body.cus_id
    var email = req.body.email



    stripe.customers.update(id, {
        email: email
      }, function(err, customer) {

        if(err != null) {

          console.log(err)

        }
        res.send(customer)
  });


});


app.post('/card', (req, res) => {

    var id = req.body.cus_id
    var source = req.body.source

    stripe.customers.createSource(
      id,
      { source: source },
      function(err, card) {
        if(err != null) {

          console.log(err)

        }
        res.send(card)
      }
);

});

app.post('/default_card', (req, res) => {

    var id = req.body.cus_id

    stripe.customers.retrieve( id,
      function(err, customer) {

        if(err != null) {

          console.log(err)

        }
        res.send(customer)
  }
);

});

app.post('/single_card', (req, res) => {

    var Card_Id = req.body.Card_Id
    var cus_id = req.body.cus_id

    stripe.customers.retrieveCard(cus_id, Card_Id,
    function(err, card) {

      if(err != null) {

        console.log(err)

      }
      res.send(card)

    }
);

});



app.post('/retrieve_token', (req, res) => {

    var number = req.body.number
    var exp_month = req.body.exp_month
    var exp_year = req.body.exp_year
    var cvc = req.body.cvc

    stripe.tokens.create({card: {
    "number": number,
    "exp_month": exp_month,
    "exp_year": exp_year,
    "cvc": cvc
  }
}, function(err, token) {
  if(err != null) {

    console.log(err)

  }
  res.send(token)
});

});


app.post('/delete_card', (req, res) => {

    var cus_id = req.body.cus_id
    var Card_Id = req.body.Card_Id

    stripe.customers.deleteCard(cus_id,Card_Id,
      function(err, confirmation) {
        // asynchronously called
        if(err != null) {

          console.log(err)

        }
        res.send(confirmation)

      }
    );
});


app.post('/refund', (req, res) => {

    var refund_id = req.body.refund_key

    stripe.refunds.create({

        charge: refund_id,

      }, function(err, refund) {
          if(err != null) {

            console.log(err)

          }
            res.send(refund)
      });

});


app.post('/retrieve_connect', (req, res) => {

    var account = req.body.account

    stripe.accounts.retrieve(
      account, function(err, account) {

        if (!err) {

            res.send(account);

        } else {

            console.log(err)
        }


      }
    );

});


app.post('/login_links', (req, res) => {

    var account = req.body.account

    stripe.accounts.createLoginLink(
      account,function(err, link) {

        if (!err) {

            res.send(link);

        } else {

            console.log(err)
        }

  }
);

});

app.post('/Transfer_payment', (req, res) => {

    var price = req.body.price
    var account = req.body.account

    stripe.transfers.create({

          amount: price,
          currency: "usd",
          destination: account,

        }, function(err, transfer) {

          if (!err) {

              res.send(transfer);

          } else {

              console.log(err)
          }

        });

});

app.post('/redirect', (req, res) => {

    authorization_code = req.body.authorization_code
    console.log(authorization_code)


    request.post({

      url: 'https://connect.stripe.com/oauth/token',
      form: { code: authorization_code, grant_type: "authorization_code", client_secret: "sk_live_MOC1tbrlvBZENX8WMEXiLhla" }

    }, function(error, response, body){

      if (!error && response.statusCode == 200) {

          res.send(body);

      } else {

          console.log(error)

      }


  });


});


function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        res.send(body);
    } else {

        console.log(error)

    }
}

app.post('/checkRCreateCandidate', (req, res) => {

  const key = req.body.YOUR_TEST_API_KEY
  var count = 0
  var ct = 0
  var send = 0
  console.log("CheckR-Profile-Request recieve: " + (ct+=1))
  Checkr.setPublishableKey(key);

  var payload = {
      first_name: req.body.first_name,
      no_middle_name: true,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      zipcode: req.body.zipcode,
      ssn: req.body.ssn,
      dob: '1970-01-22',
      driver_license_number: req.body.driver_license_number,
      driver_license_state: "NH"
    };

    Checkr.candidate.create(payload, function (status, response) {
      text = 'status:\n' + status + '\n\nresponse:\n' + JSON.stringify(response, false, 4)
      console.log(status + " repeat: " + (count += 1))
      if (status != 0 && send == 0) {
        res.send(response)
        send += 1
      }


    });


});


app.post('/checkRScreeningCandidate', (req, res) => {

  var count = 0
  var ct = 0
  var send = 0

  const Candidate_ID = req.body.id

  var payload = {
      package: "driver_pro",
      candidate_id: Candidate_ID

  };

  console.log("CheckR-Screening request recieve: " + (ct+=1))
  Checkr.setPublishableKey(checkr_secret_key);

  Checkr.screenings.ssn_trace(payload, function (status, response) {

    text = 'status:\n' + status + '\n\nresponse:\n' + JSON.stringify(response, false, 4)
    console.log(text + " repeat: " + (count += 1))
    if (status != 0 && count == 4 && send == 0) {
      res.send(response)
      send += 1
    }

  });



});





app.post('/set_default', (req, res) => {

    var cus_id = req.body.cus_id
    var Card_Id = req.body.Card_Id


    stripe.customers.update(cus_id, {
        default_source: Card_Id
  }, function(err, customer) {

    if(err != null) {

      console.log(err)

    }

    res.send(customer)

  });
});

app.post('/pre_authorization', (req, res) => {

    var cus_id = req.body.cus_id
    var amount = req.body.amount
    var source = req.body.source
    var captured = req.body.captured
    var description = req.body.description
    var receipt_email = req.body.receipt_email

    var final = false

    if (captured == 0) {

      final = false

    } else {
      final = true
    }



    stripe.charges.create({

      customer: cus_id,
      card: source,
      amount: amount,
      currency: "usd",
      description: description,
      capture: final,
      receipt_email: receipt_email,



    }, function(err, charge) {

      if(err != null) {

        console.log(err)

      }
      res.send(charge)

  });

});

app.post('/pre_authorization_apple_pay', (req, res) => {

    var token = req.body.token
    var receipt_email = req.body.receipt_email
    var amount = req.body.amount
    var description = req.body.description
    var captured = req.body.captured


    var final = false

    if (captured == 0) {

      final = false

    } else {

      final = true

    }


    stripe.charges.create({


      source: token,
      amount: amount,
      currency: "usd",
      description: description,
      capture: final,
      receipt_email: receipt_email,



    }, function(err, charge) {

      if(err != null) {

        console.log(err)

      }

      res.send(charge)

  });

});


app.post('/Capture_payment', (req, res) => {

    var charge_id = req.body.chargedID


    stripe.charges.capture(charge_id, function(err, charge) {


      if(err != null) {

        console.log(err)

      }

      res.send(charge)


    });





});

app.post('/sms_noti', (req, res) => {

    var phone = req.body.phone
    var body = req.body.body

    client.messages.create({

        to: phone,
        from: '+16194190889',
        body: body

    })
    .then((message) => console.log(message.sid));

});

app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();

  twiml.message('Your driver is comming, be ready');

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});



app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
