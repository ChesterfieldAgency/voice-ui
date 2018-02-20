var functions = require('firebase-functions');
var admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);
var db = admin.database();
var ref = db.ref('requests');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.webhook = functions.https.onRequest((request, response) => {
  request.body.result.contexts = [];
  // requests.result.contexts[0] = [];
  ref.push(request.body);
  response.send('Ok');
});
