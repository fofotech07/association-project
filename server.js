import express from "express";
import { Pool } from "pg";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------------------------------------------------------
// 1. إعداد قاعدة البيانات (PostgreSQL)
// -------------------------------------------------------------------

// Render يستخدم متغير البيئة DATABASE_URL للاتصال بقاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // مطلوب للاتصال بقواعد بيانات Render
  },
});

// دالة لإنشاء الجدول إذا لم يكن موجودًا
async function createTable() {
  try {
    const client = await pool.connect();
    const query = `
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(query);
    client.release();
    console.log("✅ تم التحقق من جدول registrations وإنشائه بنجاح.");
  } catch (err) {
    console.error("❌ خطأ في إنشاء الجدول:", err);
  }
}

// تشغيل دالة إنشاء الجدول عند بدء تشغيل الخادم
createTable();

// -------------------------------------------------------------------
// 2. إعداد الخادم
// -------------------------------------------------------------------

// إعداد مجلد public للملفات الثابتة
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------------
// 3. مسار التسجيل (POST endpoint)
// -------------------------------------------------------------------

app.post("/register", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "الرجاء ملء جميع الحقول" });
  }

  try {
    const query = `
      INSERT INTO registrations (name, email, phone)
      VALUES ($1, $2, $3)
      RETURNING id, registration_date;
    `;
    const values = [name, email, phone];
    
    const result = await pool.query(query, values);

    console.log("✅ تم حفظ تسجيل جديد (ID:", result.rows[0].id, ")");
    res.json({ message: "تم التسجيل بنجاح ✅" });
  } catch (error) {
    console.error("❌ خطأ في حفظ البيانات في قاعدة البيانات:", error);
    
    // التحقق من خطأ تكرار البريد الإلكتروني (PostgreSQL error code 23505)
    if (error.code === '23505') {
        return res.status(409).json({ error: "هذا البريد الإلكتروني مسجل بالفعل." });
    }

    return res.status(500).json({ error: "خطأ داخلي في الخادم أثناء التسجيل." });
  }
});

// -------------------------------------------------------------------
// 4. تشغيل السيرفر
// -------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
