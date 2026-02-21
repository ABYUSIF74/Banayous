@echo off
echo =======================================
echo Starting Auto Git Push...
echo =======================================

:: إضافة كل التعديلات الجديدة
git add .

:: عمل كوميت بتاريخ ووقت الرفع
git commit -m "Auto push: %date% %time%"

:: الرفع على جيت هب
git push

echo =======================================
echo Done! Code pushed successfully.
echo =======================================
pause