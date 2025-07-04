// index.js

// นำเข้าโมดูลที่จำเป็น
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// **เพิ่มบรรทัดนี้เพื่อโหลด Environment Variables จากไฟล์ .env สำหรับ Local Development**
// บรรทัดนี้ควรอยู่บนสุดของไฟล์ ก่อนที่จะเรียกใช้ process.env
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}


// สร้าง Express app
const app = express();

// ใช้ middleware สำหรับ parsing JSON request body
app.use(bodyParser.json());

// **สำคัญมาก:** กำหนด Port ให้แอปพลิเคชันฟัง
// Cloud Run และแพลตฟอร์มคลาวด์อื่นๆ จะกำหนด Port ผ่าน Environment Variable 'PORT'
// หากไม่มีการกำหนด 'PORT' (เช่น รันในเครื่องพัฒนา), จะใช้ Port 8080 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 8080;

// **สำคัญมาก:** ย้าย LINE_CHANNEL_ACCESS_TOKEN ไปยัง Environment Variable เพื่อความปลอดภัย
// ห้าม Hardcode Token ในโค้ดจริงเมื่อ Deploy ขึ้น Production
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ตรวจสอบว่า LINE_CHANNEL_ACCESS_TOKEN ถูกตั้งค่าแล้ว
if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('Error: LINE_CHANNEL_ACCESS_TOKEN is not set in environment variables.');
    // อาจจะหยุดแอปพลิเคชันหรือจัดการข้อผิดพลาดตามความเหมาะสม
    // ใน Production ควรมีการแจ้งเตือนหรือบันทึก Log ที่เหมาะสม
    process.exit(1);
}

// Endpoint สำหรับ Health Check (ไม่บังคับ แต่แนะนำอย่างยิ่งสำหรับ Cloud Deployment)
// ใช้สำหรับตรวจสอบว่าแอปพลิเคชันยังทำงานอยู่หรือไม่
app.get('/', (req, res) => {
    res.status(200).send('Line Approve Bot is running!');
});

// Webhook Endpoint สำหรับ LINE Platform
app.post('/webhook', async (req, res) => {
    // Log request body เพื่อการ Debug (สามารถลบออกใน Production ได้)
    console.log('Webhook Request Body:', JSON.stringify(req.body, null, 2));

    const events = req.body.events;

    // ตรวจสอบ Line Signature เพื่อความปลอดภัย (แนะนำอย่างยิ่ง)
    // คุณจะต้องใช้ 'line-bot-sdk' หรือเขียนฟังก์ชันตรวจสอบเอง
    // ตัวอย่าง: const signature = req.headers['x-line-signature'];
    // if (!validateSignature(req.rawBody, signature, LINE_CHANNEL_SECRET)) {
    //    return res.status(401).send('Invalid signature');
    // }

    for (const event of events) {
        console.log('Processing event:', event); // Log แต่ละ Event

        // ตรวจสอบว่าเป็น Event ประเภทข้อความและมี userId
        if (event.type === 'message' && event.source && event.source.userId) {
            const userId = event.source.userId;
            console.log(`Received message from userId: ${userId}`);

            const flexMessage = {
                to: userId,
                messages: [
                    {
                        type: "flex",
                        altText: "แจ้งเตือนการอนุมัติการลา",
                        contents: {
                            type: "bubble",
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    {
                                        type: "text",
                                        text: "แจ้งเตือนการลา",
                                        weight: "bold",
                                        size: "md"
                                    },
                                    {
                                        type: "text",
                                        text: "คุณต้องการอนุมัติการลาหรือไม่?",
                                        color: "#1DB446",
                                        size: "sm",
                                        margin: "md"
                                    }
                                ]
                            },
                            footer: {
                                type: "box",
                                layout: "vertical",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "button",
                                        style: "primary",
                                        color: "#1DB446",
                                        action: {
                                            type: "postback",
                                            label: "อนุมัติการลา",
                                            data: "action=approve"
                                        }
                                    },
                                    {
                                        type: "button",
                                        style: "secondary",
                                        color: "#FF3B30",
                                        action: {
                                            type: "postback",
                                            label: "ไม่อนุมัติ",
                                            data: "action=reject"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            };

            try {
                // ส่ง Flex Message กลับไปยังผู้ใช้
                await axios.post('https://api.line.me/v2/bot/message/push', flexMessage, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                    }
                });
                console.log(`Flex message sent to userId: ${userId}`);
            } catch (error) {
                // จัดการข้อผิดพลาดในการส่งข้อความ
                console.error('Error sending message to Line:', error.response ? error.response.data : error.message);
            }
        }
        // เพิ่มการจัดการ Event ประเภทอื่นๆ เช่น postback, follow, unfollow, join, leave
        else if (event.type === 'postback') {
            console.log('Postback event received:', event.postback.data);
            const userId = event.source.userId;
            const data = event.postback.data;

            let replyMessage = '';
            if (data === 'action=approve') {
                replyMessage = 'คุณได้อนุมัติการลาแล้ว';
                // เพิ่ม Logic สำหรับการอนุมัติการลาในระบบของคุณ
            } else if (data === 'action=reject') {
                replyMessage = 'คุณได้ไม่อนุมัติการลาแล้ว';
                // เพิ่ม Logic สำหรับการไม่อนุมัติการลาในระบบของคุณ
            }

            try {
                await axios.post('https://api.line.me/v2/bot/message/reply', {
                    replyToken: event.replyToken,
                    messages: [{ type: 'text', text: replyMessage }]
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                    }
                });
                console.log(`Reply message sent for postback: ${replyMessage}`);
            } catch (error) {
                console.error('Error replying to postback:', error.response ? error.response.data : error.message);
            }
        }
        // เพิ่มการจัดการ Event ประเภทอื่นๆ ตามความต้องการของ Line Bot ของคุณ
    }

    // ส่งสถานะ 200 OK กลับไปให้ LINE เพื่อยืนยันว่าได้รับ Event แล้ว
    res.sendStatus(200);
});

// เริ่มต้น Server ให้ฟัง Request บน Port ที่กำหนด
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access Token Status: ${LINE_CHANNEL_ACCESS_TOKEN ? 'Loaded' : 'NOT LOADED'}`);
});
