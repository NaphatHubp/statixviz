# MongoDB collections

Backend จะสร้าง collections และ indexes ให้อัตโนมัติผ่าน Mongoose เมื่อเริ่มทำงาน

- `users`: id, name, email, createdAt, updatedAt
- `problems`: problemId, fingerprint, userId, userName, distributionType, inputParams, outputResult, solvedCount, viewCount, executionTimeMs, lastSolvedAt, createdAt, updatedAt

ไม่ต้องรัน SQL หรือสร้างตารางด้วยตนเอง
