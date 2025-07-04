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

const createConfirmationFlexMessage = (userId, actionLabel, actionData) => {
    return {
        to: userId,
        messages: [
            {
                type: "flex",
                altText: `ยืนยันการ${actionLabel}`,
                contents: {
                    type: "bubble",
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: `คุณต้องการ${actionLabel}ใช่หรือไม่?`,
                                weight: "bold",
                                size: "md",
                                align: "center",
                                margin: "none"
                            }
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        margin: "md",
                        contents: [
                            {
                                type: "button",
                                style: "primary",
                                color: "#1DB446",
                                action: {
                                    type: "postback",
                                    label: "✅ ยืนยัน",
                                    data: `action=confirm&originalAction=${actionData}` // ส่งข้อมูลการดำเนินการเดิมไปด้วย
                                },
                                flex: 1
                            },
                            {
                                type: "button",
                                style: "secondary",
                                color: "#FF3B30",
                                action: {
                                    type: "postback",
                                    label: "❌ ยกเลิก",
                                    data: "action=cancel"
                                },
                                flex: 1
                            }
                        ]
                    }
                }
            }
        ]
    };
};


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
            const userId = event.source.groupId || event.source.userId; // ใช้ groupId ถ้ามี ไม่งั้นใช้ userId
            console.log(`Received message from userId: ${userId}`);

            // ข้อมูลการลา (สมมติว่าคุณได้รับข้อมูลเหล่านี้จาก Event หรือจากระบบอื่น)
            // ในโค้ดจริง คุณจะต้องดึงข้อมูลเหล่านี้มาจากแหล่งที่มาที่เหมาะสม
            const leaveDetails = {
                requester: "นายอธิเบศร์ สังฆะภูมิ",
                leaveType: "ลาพักร้อน",
                reason: "ไปเที่ยวครับ",
                dateTime: "11/07/2568 - 11/07/2568",
                totalDuration: "1 วัน 0 ชั่วโมง 0 นาที"
            };

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
                                        text: "🔔 แจ้งเตือนการลา 🔔", // เพิ่ม Emoji เพื่อความน่าสนใจ
                                        weight: "bold",
                                        size: "xl", // ปรับขนาดให้ใหญ่ขึ้น
                                        align: "center",
                                        margin: "none",
                                        color: "#333333"
                                    },
                                    {
                                        type: "separator", // เส้นแบ่งใต้หัวข้อ
                                        margin: "md"
                                    },
                                    {
                                        type: "box", // Box สำหรับรายละเอียดการลา
                                        layout: "vertical",
                                        margin: "lg",
                                        spacing: "sm",
                                        contents: [
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "ผู้ขอลา:", flex: 2, size: "sm", color: "#AAAAAA" },
                                                    { type: "text", text: leaveDetails.requester, flex: 5, size: "sm", wrap: true }
                                                ]
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "ประเภทการลา:", flex: 2, size: "sm", color: "#AAAAAA" },
                                                    { type: "text", text: leaveDetails.leaveType, flex: 5, size: "sm", wrap: true }
                                                ]
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "เหตุผล:", flex: 2, size: "sm", color: "#AAAAAA" },
                                                    { type: "text", text: leaveDetails.reason, flex: 5, size: "sm", wrap: true }
                                                ]
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "วันที่ / เวลา:", flex: 2, size: "sm", color: "#AAAAAA" },
                                                    { type: "text", text: leaveDetails.dateTime, flex: 5, size: "sm", wrap: true }
                                                ]
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "(รวม:", flex: 2, size: "sm", color: "#AAAAAA" },
                                                    { type: "text", text: leaveDetails.totalDuration + ")", flex: 5, size: "sm", wrap: true }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        type: "separator", // เส้นแบ่งก่อนคำถามอนุมัติ
                                        margin: "lg"
                                    },
                                    {
                                        type: "text",
                                        text: "คุณต้องการอนุมัติการลาหรือไม่?",
                                        color: "#1DB446", // สีเขียวสดใส
                                        size: "md",
                                        align: "center",
                                        margin: "lg",
                                        weight: "bold"
                                    }
                                ]
                            },
                            footer: {
                                type: "box",
                                layout: "horizontal", // **เปลี่ยนเป็น horizontal เพื่อให้ปุ่มอยู่แถวเดียวกัน**
                                spacing: "sm", // ระยะห่างระหว่างปุ่ม
                                margin: "md", // Margin รอบ footer box
                                contents: [
                                    {
                                        type: "button",
                                        style: "primary",
                                        color: "#1DB446", // สีเขียว
                                        action: {
                                            type: "postback",
                                            label: "✅ อนุมัติ", // เพิ่ม Emoji
                                            data: "action=approve"
                                        },
                                        flex: 1 // ให้ปุ่มขยายเต็มพื้นที่เท่าๆ กัน
                                    },
                                    {
                                        type: "button",
                                        style: "secondary",
                                        color: "#FF3B30", // สีแดง
                                        action: {
                                            type: "postback",
                                            label: "❌ ไม่อนุมัติ", // เพิ่ม Emoji
                                            data: "action=reject"
                                        },
                                        flex: 1 // ให้ปุ่มขยายเต็มพื้นที่เท่าๆ กัน
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

            // แยกวิเคราะห์ข้อมูล postback
            const params = new URLSearchParams(data);
            const action = params.get('action');
            const originalAction = params.get('originalAction'); // สำหรับ Flow การยืนยัน

            let replyMessage = '';

            if (action === 'approve') {
                // ส่งข้อความยืนยันการอนุมัติ
                const confirmMessage = createConfirmationFlexMessage(userId, 'อนุมัติการลา', 'approve');
                try {
                    await axios.post('https://api.line.me/v2/bot/message/push', confirmMessage, { // ใช้ push สำหรับส่งข้อความใหม่
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                        }
                    });
                    console.log(`Confirmation message sent for approve to userId: ${userId}`);
                } catch (error) {
                    console.error('Error sending confirmation message:', error.response ? error.response.data : error.message);
                }
            } else if (action === 'reject') {
                // ส่งข้อความยืนยันการไม่อนุมัติ
                const confirmMessage = createConfirmationFlexMessage(userId, 'ไม่อนุมัติการลา', 'reject');
                try {
                    await axios.post('https://api.line.me/v2/bot/message/push', confirmMessage, { // ใช้ push สำหรับส่งข้อความใหม่
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                        }
                    });
                    console.log(`Confirmation message sent for reject to userId: ${userId}`);
                } catch (error) {
                    console.error('Error sending confirmation message:', error.response ? error.response.data : error.message);
                }
            } else if (action === 'confirm' && originalAction) {
                // เมื่อผู้ใช้ยืนยันการดำเนินการ
                if (originalAction === 'approve') {
                    replyMessage = 'คุณได้อนุมัติการลาแล้ว';
                    // เพิ่ม Logic สำหรับการอนุมัติการลาในระบบของคุณ
                } else if (originalAction === 'reject') {
                    replyMessage = 'คุณได้ไม่อนุมัติการลาแล้ว';
                    // เพิ่ม Logic สำหรับการไม่อนุมัติการลาในระบบของคุณ
                }
                try {
                    await axios.post('https://api.line.me/v2/bot/message/reply', {
                        replyToken: event.replyToken, // ใช้ replyToken จาก postback ของปุ่มยืนยัน/ยกเลิก
                        messages: [{ type: 'text', text: replyMessage }]
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                        }
                    });
                    console.log(`Final action message sent: ${replyMessage}`);
                } catch (error) {
                    console.error('Error replying to confirmation:', error.response ? error.response.data : error.message);
                }
            } else if (action === 'cancel') {
                // เมื่อผู้ใช้ยกเลิกการดำเนินการ
                replyMessage = 'การดำเนินการถูกยกเลิก';
                try {
                    await axios.post('https://api.line.me/v2/bot/message/reply', {
                        replyToken: event.replyToken, // ใช้ replyToken จาก postback ของปุ่มยืนยัน/ยกเลิก
                        messages: [{ type: 'text', text: replyMessage }]
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                        }
                    });
                    console.log(`Action cancelled message sent.`);
                } catch (error) {
                    console.error('Error replying to cancellation:', error.response ? error.response.data : error.message);
                }
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
