const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
// SendGrid Config
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

const db = admin.firestore();

app.use(cors({ origin: true }));
app.use(express.json());

const API_KEY = functions.config().sendgrid.key;
const TEMPLATE_WELCOME = functions.config().sendgrid.templatewelcome;
const TEMPLATE_NOTIFY = functions.config().sendgrid.templatenotify;

console.log(TEMPLATE_WELCOME);

sgMail.setApiKey(API_KEY);

exports.createUser = functions
  .region('europe-west1')
  .firestore.document('queue/{queueId}')
  .onCreate((snap, context) => {
    const result = snap.data();

    const name = result.name;
    const id = context.params.queueId;

    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <body>
    <div style="text-align: center">
    <h4>${name} שלום</h4>
    <p>
ברוכים הבאים לתור של יום האימוץ של אדופט
    </p>
    <p>מספרכם בתור</p>
    <h1 style="color: #1890ff">${id}</h1>
    <br/>
    <p>ניתן לעקוב באתר אחרי המספר שלכם</p>
    <a href="https://google.com">לחצו כאן למעבר לאתר</a>
    </div>
    </body>
    </html>`;

    axios({
      method: 'POST',
      url: 'https://api.sendgrid.com/v3/mail/send',
      headers: {
        authorization: 'Bearer ' + API_KEY,
        'content-type': 'application/json',
        // accept: 'application/json',
        useQueryString: true,
      },
      data: {
        personalizations: [
          {
            to: [
              {
                email: 'asaflanzer@gmail.com',
              },
            ],
            subject: 'Adopt Dog Shelter - ברוכים הבאים לתור',
            // dynamic_template_data: {
            //   subject: 'Adopt Dog Shelter - ברוכים הבאים לתור',
            //   name: 'רון',
            //   number: '006',
            // },
          },
        ],
        from: {
          email: 'adoptdogshelterfoundation@gmail.com',
          name: 'Adopt Dog Shelter',
        },
        //template_id: 'd-227fe7ba0215400da048b979ed0fe766',
        content: [
          {
            type: 'text/html',
            value: htmlTemplate,
          },
        ],
      },
    })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  });

exports.updateUser = functions
  .region('europe-west1')
  .firestore.document('queue/{queueId}')
  .onWrite(async (change, context) => {
    // Read the queue document
    const postSnap = await db
      .collection('queue')
      .doc(context.params.queueId)
      .get();
    // Raw data
    const changedData = change.after.data() || {};

    if (changedData.status === 'notified') {
      const name = changedData.name;
      const id = context.params.queueId;

      const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <body>
      <div style="text-align: center">
      <h4>${name} שלום</h4>
      <p>
  תורכם מתקרב, נא לחזור לכניסה ולהמתין
      </p>
      <p>מספרכם בתור</p>
      <h1 style="color: #1890ff">${id}</h1>
      <br/>
      <p>ניתן לעקוב באתר אחרי המספר שלכם</p>
      <a href="https://google.com">לחצו כאן למעבר לאתר</a>
      </div>
      </body>
      </html>`;

      axios({
        method: 'POST',
        url: 'https://api.sendgrid.com/v3/mail/send',
        headers: {
          authorization: 'Bearer ' + API_KEY,
          'content-type': 'application/json',
          // accept: 'application/json',
          useQueryString: true,
        },
        data: {
          personalizations: [
            {
              to: [
                {
                  email: 'asaflanzer@gmail.com',
                },
              ],
              subject: 'Adopt Dog Shelter - התור שלכם מתקרב',
            },
          ],
          from: {
            email: 'adoptdogshelterfoundation@gmail.com',
            name: 'Adopt Dog Shelter',
          },
          content: [
            {
              type: 'text/html',
              value: htmlTemplate,
            },
          ],
        },
      })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.log(error);
        });
    } else return true;
  });
