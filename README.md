# StatixViz + MongoDB

โปรเจกต์นี้แยก Frontend (React/Vite) กับ Backend API (Express) โดยให้ **Backend** เป็นส่วนเดียวที่เชื่อม MongoDB ห้ามใส่ connection string หรือ credentials ใน React/Vite เพราะค่าฝั่ง frontend จะถูกเปิดเผยต่อผู้ใช้ได้

## สิ่งที่มีในโปรเจกต์

- บันทึกและโหลดผลการคำนวณผ่าน `GET /api/problems` และ `POST /api/problems`
- บันทึก/ค้นหาผู้ใช้ demo ด้วยอีเมลผ่าน `POST /api/users`
- ตรวจสอบสถานะ MongoDB ผ่าน `GET /api/health`
- ใช้ Mongoose schemas และ indexes; collections จะถูกสร้างเมื่อมีการบันทึกข้อมูล
- fingerprint ถูก hash ด้วย SHA-256 ก่อนบันทึก และโจทย์ที่มี fingerprint ซ้ำจะเพิ่ม `solvedCount` และ `viewCount`

> หมายเหตุ: ฟอร์มเข้าสู่ระบบมีเพียงชื่อและอีเมล จึงเป็น **demo identity** ไม่ใช่ระบบยืนยันตัวตนที่ปลอดภัยสำหรับ production (ไม่มีรหัสผ่าน/session)

## 1. ตั้งค่า MongoDB Atlas

1. สร้าง cluster ใน MongoDB Atlas หรือเตรียม MongoDB instance ที่เข้าถึงได้
2. ใน Atlas ไปที่ **Database Access** แล้วสร้าง database user และรหัสผ่าน
3. ใน **Network Access** อนุญาต IP ของเครื่องที่รัน backend (หลีกเลี่ยงการเปิด `0.0.0.0/0` ใน production)
4. กด **Connect → Drivers → Node.js** แล้วคัดลอก connection string
5. แทนที่ username, password และ cluster host ใน connection string ให้ถูกต้อง ชื่อ database ในตัวอย่างคือ `statixviz`

ไม่ต้องรัน SQL หรือสร้าง collection เอง Mongoose จะสร้าง collections/indexes ตาม schema เมื่อเริ่มใช้งาน

## 2. ตั้งค่า Backend

เปิด terminal ที่โฟลเดอร์โปรเจกต์ แล้วรัน:

```bash
cd server
npm install
```

คัดลอก `server/.env.example` เป็น `server/.env` แล้วกำหนดค่า:

```env
PORT=3001
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/statixviz?retryWrites=true&w=majority
FRONTEND_ORIGIN=http://localhost:5173
```

ถ้ารหัสผ่านมีอักขระพิเศษ เช่น `@`, `#`, `/` ต้อง URL-encode รหัสผ่านก่อนใส่ใน URI ห้าม commit `server/.env` หรือส่ง connection string ให้ผู้อื่น

เริ่ม API:

```bash
npm run dev
```

เปิด `http://localhost:3001/api/health` ควรได้ผลลัพธ์ลักษณะนี้เมื่อเชื่อมต่อสำเร็จ:

```json
{ "status": "ok", "database": "connected", "provider": "MongoDB" }
```

## 3. เริ่ม Frontend

เปิด terminal อีกหน้าต่างที่โฟลเดอร์หลักของโปรเจกต์:

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ `http://localhost:5173`) หาก backend อยู่คนละ URL ให้สร้าง `.env` ที่ root:

```env
VITE_API_URL=http://localhost:3001
```

จากนั้น restart Vite

## 4. ตรวจสอบข้อมูลจริง

1. เปิด `/api/health` แล้วดูว่า `database` เป็น `connected`
2. เข้าสู่ระบบด้วยชื่อและอีเมลใน UI
3. คำนวณแล้วบันทึกผล
4. ใน MongoDB Atlas เปิด **Browse Collections** → database `statixviz` → collections `users` และ `problems`
5. รีเฟรชหน้าเว็บ ข้อมูลจะถูกโหลดจาก API และ MongoDB

## API

- `GET /api/health` — ตรวจ API และสถานะ MongoDB
- `POST /api/users` — สร้างผู้ใช้ demo หรือคืนผู้ใช้เดิมตามอีเมล
- `GET /api/problems` — อ่านโจทย์ล่าสุดไม่เกิน 500 รายการ
- `POST /api/problems` — เพิ่มโจทย์หรือเพิ่มจำนวนครั้งเมื่อ fingerprint ซ้ำ

## โครงสร้าง

```text
src/App.tsx          React UI + statistical classes
src/main.tsx         React entry point
server/index.js      Express API + Mongoose/MongoDB
server/.env.example  ตัวอย่างตัวแปรลับ
database/README.md   รายละเอียด collections
```

## ข้อควรรู้

- ต้องตั้งค่า `MONGODB_URI` และ Network Access ให้ถูกต้องก่อน backend จะเชื่อมต่อได้
- อย่าใส่ MongoDB URI ในตัวแปร `VITE_` หรือ source code ฝั่ง frontend
- ระบบ login เป็น demo identity เท่านั้น หากใช้งานจริงต้องเพิ่ม authentication, password hashing, sessions/JWT, rate limiting และ validation
- ยังไม่ได้ทดสอบกับ cluster จริง เพราะต้องใช้ connection string ของเจ้าของฐานข้อมูล
