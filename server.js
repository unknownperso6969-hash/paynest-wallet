const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// डेटा पढ़ने के लिए ज़रूरी सेटिंग्स
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// नकली डेटाबेस (शुरुआती बैलेंस और रिक्वेस्ट लिस्ट)
let userWallet = {
    balance: 5000,
    name: "Rahul Sharma"
};
let pendingDeposits = [];
let pendingWithdrawals = [];

// 1. मुख्य पेज (Frontend) लोड करने के लिए
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. वर्तमान बैलेंस चेक करने का रास्ता
app.get('/api/balance', (req, res) => {
    res.json({ balance: userWallet.balance });
});

// 3. जब यूजर पैसे जमा (Deposit) की रिक्वेस्ट भेजेगा
app.post('/api/deposit', (req, res) => {
    const { utr, method, amount } = req.body;

    // यह आपके लैपटॉप के टर्मिनल में डेटा प्रिंट करेगा!
    console.log(`\n📢 [NEW DEPOSIT REQUEST]`);
    console.log(`Method: ${method || 'UPI/QR'}`);
    console.log(`UTR Number: ${utr}`);
    console.log(`Amount: ₹${amount || '2000'}`);

    // लिस्ट में सेव करें ताकि एडमिन देख सके
    pendingDeposits.push({ id: Date.now(), utr, amount: parseInt(amount) || 2000, status: 'Pending' });

    res.json({ success: true, message: "Deposit Request Submitted Successfully!" });
});

// 4. जब यूजर पैसे निकालने (Withdraw) की रिक्वेस्ट भेजेगा
app.post('/api/withdraw', (req, res) => {
    const { upi, amount } = req.body;

    console.log(`\n💸 [NEW WITHDRAWAL REQUEST]`);
    console.log(`UPI ID: ${upi}`);
    console.log(`Amount: ₹${amount}`);

    pendingWithdrawals.push({ id: Date.now(), upi, amount: parseInt(amount), status: 'Pending' });

    res.json({ success: true, message: "Withdrawal Request Submitted!" });
});

// 5. एडमिन पैनल का रास्ता (जहाँ आप रिक्वेस्ट अप्रूव करेंगे)
app.get('/admin', (req, res) => {
    let depositRows = pendingDeposits.map(d => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">${d.utr}</td>
            <td style="padding: 10px;">₹${d.amount}</td>
            <td style="padding: 10px;"><a href="/admin/approve-deposit/${d.id}" style="background: green; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px;">Approve ✅</a></td>
        </tr>
    `).join('');

    res.send(`
        <html>
        <head><title>PayNest Admin</title></head>
        <body style="font-family: Arial, sans-serif; padding: 30px; background: #f4f6f9;">
            <h2>PayNest Admin Dashboard 👑</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3>Pending Deposits</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #eee; text-align: left;">
                        <th style="padding: 10px;">UTR / Transaction ID</th>
                        <th style="padding: 10px;">Amount</th>
                        <th style="padding: 10px;">Action</th>
                    </tr>
                    ${depositRows || '<tr><td colspan="3" style="padding:10px; text-align:center;">No pending requests</td></tr>'}
                </table>
            </div>
            <br>
            <a href="/" style="display: inline-block; margin-top: 20px; color: #0066cc;">Go back to Wallet App</a>
        </body>
        </html>
    `);
});

// 6. डिपॉजिट अप्रूव करने का लॉजिक
app.get('/admin/approve-deposit/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const depositIndex = pendingDeposits.findIndex(d => d.id === id);

    if (depositIndex !== -1) {
        // यूजर का बैलेंस बढ़ाएं
        userWallet.balance += pendingDeposits[depositIndex].amount;
        console.log(`\n✅ [APPROVED] Balance updated! New Balance: ₹${userWallet.balance}`);
        // लिस्ट से हटाएं
        pendingDeposits.splice(depositIndex, 1);
    }
    res.redirect('/admin');
});

app.listen(PORT, () => {
    console.log(`🚀 PayNest server is perfectly running on http://localhost:${PORT}`);
});
