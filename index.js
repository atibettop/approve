const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const LINE_CHANNEL_ACCESS_TOKEN = 'RIRNahcLRGbZIsW0FUhV+hdW0LyAlq/tEtwPCpE1Uh1pEdk89AOabNL23p4Wi/il/rpy/RE2H1BH6+PQywo5TTvm/WB0Du9YyE/GHf3ejpKEkJZMXgm0xlOthSi6rKkNVuAD66cXmAVl/sms/3+7HgdB04t89/1O/w1cDnyilFU=';

app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    for (const event of events) {
        if (event.type === 'message' && event.source && event.source.userId) {
            const userId = event.source.userId;

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

            await axios.post('https://api.line.me/v2/bot/message/push', flexMessage, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                }
            });
        }
    }
    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});