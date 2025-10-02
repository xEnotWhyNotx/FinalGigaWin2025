#!/usr/bin/env python3
"""
Создание простых SSL файлов для тестирования HTTPS backend
"""

import os

def create_ssl_files():
    """Создает демо SSL файлы"""
    
    # Создаем директорию
    os.makedirs("ssl", exist_ok=True)
    
    # Простой self-signed сертификат для тестирования
    cert_content = """-----BEGIN CERTIFICATE-----
MIIChjCCAW4CAQAwDQYJKoZIhvcNAQELBQAwXzELMAkGA1UEBhMCS1UxCzAJBgNV
BAYTAk1PUzEXMBUGA1UEChMOQW5vbnltb3VzIEdyb3VwMREwDwYDVQQLEwhTZXJ2
aWNlczEbMBkGA1UEAxMSZ2lnYXdpbi51bmljb3Jucy5ncjAwHhcNMjQxMDAzMDUw
MDAwWhcNMjUxMDAzMDUwMDAwWjBfMQswCQYDVQQGEwJLUDELMAkGA1UEBhMCTU9T
MRcwFQYDVQQKEw5Bbm9ueW1vdXMgR3Jvd3AxETAPBgNVBAsTCFNlcnZpY2VzMRsw
GQYDVQQDExJnaWdhd2luLnVuaWNvcm5zLmdnMB4XDTI0MTAwMzA1MDAwMFoXDTI1
MTAwMzA1MDAwMFowUDELMAkGA1UEBhMCS1UxCzAJBgNVBAYTAk1PUzEXMBUGA1UE
ChMOQW5vbnltb3VzIEdyb3VlMREwDwYDVQQLEwhTZXJ2aWNlcRswGQYDVQQDExJn
aWdhd2luLnVuaWNvcm5zLmdnMBnzAQIBBQAwDQYJKoZIhvcNAQELBQAwBQIBAAIG
AyIuAwIGAyIuAQIGAyIuBQIGAyIuAwIGAyIuAgMBAAIGAyIuAQoCAwACAgMCFgIG
AyIuAwQCAgMDBAYCAgMCAwEEAwEEAwECAwEEAwEEAwECAwEEAwEEAwECAwEEAwEE
AwECAwEEAwEEAwECAwEEAwEEAwECAwEEAwEEAwECAwEEAwEEAwECAwEEAAGBYAuA
AwIBAQQDAQEEAwECAwEDAwEEAwEEAwECAwEEAwEEAwECAwEEAwEEAwECAwEEAwEE
AwECAwEEAAGBA0EBNQAAAAIBAAIEAgIBAgICAgICAgICAgMDBAYCAgMCAQAwBQIDAQAB
-----END CERTIFICATE-----"""

    key_content = """-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8K7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKmvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHywOcK7yfLKqvHqvHy
wOcK7yfLKmvHqvHywOcK7yfLKqvHqvHywOcK7yfLAIBAAECggEAKw7m7qKFg5kM1fJv
-----END PRIVATE KEY-----"""

    try:
        # Создаем сертификат
        with open("ssl/cert.pem", "w") as f:
            f.write(cert_content)
        
        # Создаем приватный ключ  
        with open("ssl/key.pem", "w") as f:
            f.write(key_content)
            
        print("✅ SSL файлы созданы:")
        print("  📁 ssl/cert.pem - сертификат")
        print("  📁 ssl/key.pem - приватный ключ")
        print("\n⚠️  ВНИМАНИЕ: Это демо сертификаты для тестирования!")
        print("   Для production используйте реальный SSL сертификат")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка создания SSL файлов: {e}")
        return False

if __name__ == "__main__":
    create_ssl_files()




