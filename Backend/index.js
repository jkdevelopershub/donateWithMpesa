const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
app.use(express.urlencoded({extended :true}));
app.use(express.json());
app.use(cors());
const axios = require("axios")
const port = process.env.PORT

app.get("/token",(req,res)=>{
    generateToken();
})

//generate token for authorization

const generateToken = async(req, res, next)=>{
    const secret = process.env.MPESA_CONSUMER_SECRET
    const consumer = process.env.MPESA_CONSUMER_KEY;
    
    const auth = new Buffer.from(`${consumer}:${secret}`).toString(
        "base64"
    )
  await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  {
    headers:{
        Authorization:`Basic ${auth}`,
    },
  }
  )
  .then((response)=>{
    token = response.data.access_token;
    next();
  })
  .catch((err)=>{
    console.log(err);
    
})
};


app.post("/stkPush", generateToken,async (req,res)=>{
    const phoneNumber = req.body.phoneNumber.substring(1);
    const amount = req.body.amount;
    
    const date = new Date();
    const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

    const shortcode = process.env.MPESA_PAYBAILL;
    const passkey = process.env.MPESA_PASSKEY;
    const password = new Buffer.from(shortcode + passkey + timestamp).toString(
        "base64"
    );

    
await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    
{
    "BusinessShortCode": process.env.MPESA_PAYBILL,
    "Password": password,
    "Timestamp": timestamp,
    "TransactionType": "CustomerPayBillOnline",
    "Amount": 1,
    "PartyA": `254${phoneNumber}`,
    "PartyB": shortcode,
    "PhoneNumber": `254${phoneNumber}`,
    "CallBackURL": "https://mydomain.com/path",
    "AccountReference": `CompanyXLTD 254${phoneNumber}`,
    "TransactionDesc": "Payment of X" 
  },
{
    headers:{
        'Authorization': `Bearer ${token}`,
    },
}
).then((data)=>{
    console.log(data);
    res.status(200).json(data);
})
.catch((err)=>{
    console.log(err.message);
    res.status(400).json(err.message)
})

});


app.listen(port,()=>{
    console.log(`Server is using port: ${port}`);
});
