#!/usr/bin/env python3
"""
Генерация self-signed SSL сертификата для GigaWin backend
"""

import os
import subprocess
import sys

def generate_ssl_certificate():
    """Генерирует самоподписанный SSL сертификат"""
    
    # Создаем директорию если не существует
    os.makedirs("ssl", exist_ok=True)
    
    # Команда для генерации сертификата
    cmd = [
        "python", "-c",
        """
import ssl
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
import datetime

# Генерируем приватный ключ
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# Создаем сертификат
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, "RU"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Moscow"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, "Moscow"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "GigaWin"),
    x509.NameAttribute(NameOID.COMMON_NAME, "gigawin.unicorns-group.ru"),
])

cert = x509.CertificateBuilder().subject_name(
    subject
).issuer_name(
    issuer
).public_key(
    private_key.public_key()
).serial_number(
    x509.random_serial_number()
).not_valid_before(
    datetime.datetime.utcnow()
).not_valid_after(
    datetime.datetime.utcnow() + datetime.timedelta(days=365)
).add_extension(
    x509.SubjectAlternativeName([
        x509.DNSName("gigawin.unicorns-group.ru"),
        x509.DNSName("localhost"),
        x509.IPAddress("127.0.0.1"),
    ]),
    critical=False,
).sign(private_key, hashes.SHA256())

# Сохраняем приватный ключ
with open("ssl/key.pem", "wb") as f:
    f.write(private_key.private_bytes(
        encoding=Encoding.PEM,
        format=PrivateFormat.PEM,
        encryption_algorithm=NoEncryption()
    ))

# Сохраняем сертификат
with open("ssl/cert.pem", "wb") as f:
    f.write(cert.public_bytes(Encoding.PEM))

print("SSL сертификат создан успешно!")
        """
    ]
    
    try:
        # Пытаемся использовать cryptography библиотеку
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ SSL сертификат сгенерирован успешно!")
            return True
        else:
            print(f"❌ Ошибка генерации сертификата: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Не удалось найти Python с библиотекой cryptography")
        return False

if __name__ == "__main__":
    if generate_ssl_certificate():
        print("\n📂 Файлы созданы:")
        print("  - ssl/cert.pem (сертификат)")
        print("  - ssl/key.pem (приватный ключ)")
    else:
        print("\n🔧 Альтернативный способ:")
        print("Создайте файлы вручную или используйте онлайн генератор SSL сертификатов")
        
        # Создаем простые заглушки для тестирования
        print("\n⚠️ Создаю простые SSL файлы для тестирования...")
        try:
            with open("ssl/cert.pem", "w") as f:
                f.write("# SSL Certificate - создайте реальный сертификат\n# Для production используйте Let's Encrypt или купленный сертификат\n")
            
            with open("ssl/key.pem", "w") as f:
                f.write("# SSL Private Key - создайте реальный приватный ключ\n# Для production используйте безопасное хранилище ключей\n")
                
            print("✅ Заглушки созданы. ЗАМЕНИТЕ НА РЕАЛЬНЫЕ SSL ФАЙЛЫ!")
        except Exception as e:
            print(f"❌ Ошибка создания файлов: {e}")




