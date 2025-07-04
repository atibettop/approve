# ใช้ Node.js official image เป็น base image
# แนะนำให้ใช้เวอร์ชัน LTS (Long Term Support) เช่น node:20-slim
# `slim` version มีขนาดเล็กกว่า เหมาะสำหรับ Production
FROM node:20-slim

# กำหนด Working Directory ภายใน Container
# ทุกคำสั่งหลังจากนี้จะทำงานในไดเรกทอรีนี้
WORKDIR /usr/src/app

# คัดลอกไฟล์ package.json และ package-lock.json (หรือ yarn.lock)
# ไปยัง Working Directory
# การแยกขั้นตอนนี้ทำให้ Docker สามารถใช้ Cache ได้เร็วขึ้น
# ถ้า dependencies ไม่มีการเปลี่ยนแปลง
COPY package*.json ./

# ติดตั้ง dependencies ที่ระบุใน package.json
# --omit=dev จะไม่ติดตั้ง devDependencies ซึ่งไม่จำเป็นสำหรับ Production
RUN npm install --omit=dev

# คัดลอกโค้ดแอปพลิเคชันทั้งหมดจากเครื่องของคุณ
# ไปยัง Working Directory ภายใน Container
# จุด (.) แรก หมายถึง Current directory ของโปรเจกต์คุณ
# จุด (.) ที่สอง หมายถึง Working Directory ภายใน Container (/usr/src/app)
COPY . .

# กำหนด PORT ที่ Container จะ "เปิด" ให้แอปพลิเคชันฟัง
# Cloud Run จะใช้ PORT นี้ (โดยปกติ Cloud Run จะ inject PORT=8080)
# แม้จะไม่ได้บังคับสำหรับ Cloud Run แต่ก็เป็น Best Practice ที่ดี
EXPOSE 8080

# คำสั่งที่จะรันเมื่อ Container เริ่มทำงาน
# `npm start` จะรันคำสั่งที่ระบุไว้ใน "start" script ใน package.json ของคุณ
CMD [ "npm", "start" ]
