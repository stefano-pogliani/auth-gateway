import aws from 'aws-sdk';
import nodemailer from 'nodemailer';


/**
 * NodeMaler transport factories.
 */
const TRANSPORTS = {
  ses(conf) {
    if (conf.email_aws_config) {
      aws.config.loadFromPath(conf.email_aws_config);
    }
    return nodemailer.createTransport({
      SES: new aws.SES({apiVersion: '2010-12-01'})
    });
  },

  smtp(conf) {
    return nodemailer.createTransport({
      host: conf.email_smtp_host,
      port: conf.email_smtp_port,
      secure: conf.email_smtp_secure
    });
  },

  stream(conf) {
    return nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'windows'
    });
  }
};


/**
 * Send the report off as an HTML email.
 */
export const email = async (conf, subject, report) => {
  const email_transport = conf.email_transport;
  const makeTransport = TRANSPORTS[email_transport];
  if (!makeTransport) {
    throw Error(`Unsupported email transport: ${email_transport}`);
  }

  const transport = makeTransport(conf);
  const options = {
    from: conf.email_from,
    to: conf.email_to.join(','),
    subject: subject,
    html: report
  };

  const sendMail = new Promise((resolve, reject) => {
    transport.sendMail(options, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

  const info = await sendMail;
  if (info.message) {
    console.log('Email body:', info.message.toString());
  } else {
    console.log('Email sent:', JSON.stringify({
      from: info.envelope.from,
      to: info.envelope.to,
      messageId: info.messageId
    }, null, 2));
  }
};
