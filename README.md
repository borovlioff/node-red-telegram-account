Вот первая версия README для вашего набора Node-RED узлов Telegram. Я разбил его на части: установка, описание узлов, примеры использования.

---

# Node-RED Telegram Nodes

A set of Node-RED nodes for interacting with the Telegram API, including authentication, message sending, receiving, dialogs and entity management.

---

## Features

* Telegram authentication with `stringSession`.
* Send messages with formatting, media, buttons, and scheduled delivery.
* Receive messages with optional ignore lists.
* Iterate through messages and dialogs.
* Delete messages.
* Retrieve Telegram entities by username or ID.
* Handle commands via regex or exact match.
* Works with multiple Telegram clients.

---

## Installation

```bash
npm i node-red-telegram-account
```
---

## Nodes

### 1. Auth Node (`auth`)

Authenticate a Telegram account and retrieve a `stringSession`.

**Inputs:**

* `payload.api_id` (number | string) – Telegram API ID
* `payload.api_hash` (string) – Telegram API hash
* `payload.phoneNumber` (string) – Phone number
* `payload.password` (string, optional) – 2FA password

**Outputs:**

* `topic = "need_code"` – Waiting for Telegram code
* `topic = "auth_success"` – Authentication successful, returns `stringSession`
* `topic = "auth_error"` – Error occurred

---

### 2. Config Node (`config`)

Stores and manages a Telegram client instance for other nodes.

* Uses `stringSession`, `api_id`, and `api_hash` to create a connected client.
* Automatically reconnects on startup.

---

### 3. Send Message Node (`send-message`)

Send messages, media, or buttons to Telegram chats.

**Inputs (via `msg.payload`):**

* `chatId`, `message`, `parseMode`, `replyTo`, `buttons`, `file`, `silent`, etc.

**Output:**

* `msg.payload.response` – Telegram API response.

**Behavior:**

* Resolves usernames and chat IDs.
* Supports scheduled messages.
* Retries if peer resolution fails.

**Example:**

```json
{
  "payload": {
    "chatId": "@example_channel",
    "message": "Hello, Telegram!",
    "parseMode": "Markdown",
    "buttons": [[{ "text": "Click me", "url": "https://example.com" }]]
  }
}
```

---

### 4. Receiver Node (`receiver`)

Receives messages and outputs them via Node-RED.

* Can ignore specific user IDs.
* Output payload contains the full Telegram message object.

---

### 5. Command Node (`command`)

Listens for messages matching a regex or exact string and outputs them.

* Useful for bot commands.
* Output payload contains the update object.

---

### 6. Iter Messages Node (`iter-messages`)

Iterate over messages in a chat with filters, limits, and offsets.

* Supports message filters from `telegram.Api`.
* Can iterate with offset, min/max IDs, search terms, and more.

---

### 7. Iter Dialogs Node (`iter-dialogs`)

Iterate over all dialogs (chats, groups, channels).

* Supports offset, folder, archived, and pinned messages.

---

### 8. Get Entity Node (`get-entity`)

Get Telegram entities by username, chat ID, or URL.

* Output contains the resolved entity object.

---

### 9. Delete Message Node (`delete-message`)

Delete messages from a chat.

* Accepts `chatId`, `messageIds`, and `revoke` options.

---

## Examples

```json
[
    {
        "id": "8a2bdcc91b0e57f2",
        "type": "auth",
        "z": "5171de7e11632b7c",
        "api_id": "16889767",
        "api_hash": "a0cb20557627f8a8f0b163339e1fd0b0",
        "phoneNumber": "",
        "password": "",
        "x": 460,
        "y": 400,
        "wires": [
            [
                "38fa03db4cb03cde"
            ]
        ]
    },
    {
        "id": "630c8d5ae77c99dd",
        "type": "template",
        "z": "5171de7e11632b7c",
        "name": "",
        "field": "payload",
        "fieldType": "msg",
        "format": "handlebars",
        "syntax": "mustache",
        "template": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Telegram Authorization</title>\n  <style>\n    body {\n      font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n      background-color: #e6ecf0;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      height: 100vh;\n      margin: 0;\n    }\n    .container {\n      background: #ffffff;\n      padding: 30px 25px;\n      border-radius: 12px;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.1);\n      width: 380px;\n      color: #1c1c1c;\n    }\n    h2 { text-align: center; color: #0088cc; margin-bottom: 25px; font-size: 24px; }\n    h3 { color: #0088cc; font-size: 18px; margin-bottom: 10px; }\n    label { display: block; margin-bottom: 12px; font-size: 14px; }\n    input[type=\"text\"], input[type=\"password\"] {\n      width: 100%; padding: 10px 12px; margin-top: 5px;\n      border: 1px solid #d1d1d1; border-radius: 8px;\n      box-sizing: border-box; font-size: 14px; transition: border 0.2s;\n    }\n    input:focus { border: 1px solid #0088cc; outline: none; }\n    button {\n      width: 100%; padding: 12px; background-color: #0088cc;\n      border: none; color: white; font-size: 16px; font-weight: 500;\n      border-radius: 8px; cursor: pointer; margin-top: 10px;\n      transition: background 0.2s;\n    }\n    button:hover { background-color: #007ab8; }\n    #codeDiv { margin-top: 20px; }\n    #result { word-break: break-all; margin-top: 15px; text-align: center; font-weight: bold; font-size: 14px; }\n    .success { color: #28a745; }\n    .error { color: #e84118; }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <h2>Telegram Authorization</h2>\n    <form id=\"authForm\">\n      <label>API ID <input type=\"text\" name=\"api_id\" ></label>\n      <label>API Hash <input type=\"text\" name=\"api_hash\" ></label>\n      <label>Phone Number <input type=\"text\" name=\"phoneNumber\" required></label>\n      <label>Password (if any) <input type=\"password\" name=\"password\"></label>\n      <button type=\"submit\">Authorize</button>\n    </form>\n\n    <div id=\"codeDiv\" style=\"display:none;\">\n      <h3>Enter Telegram Code</h3>\n      <input type=\"text\" id=\"phoneCode\" placeholder=\"Enter code\">\n      <button id=\"sendCode\">Submit Code</button>\n    </div>\n\n    <div id=\"result\"></div>\n  </div>\n\n  <script>\n    const form = document.getElementById(\"authForm\");\n    const codeDiv = document.getElementById(\"codeDiv\");\n    const resultDiv = document.getElementById(\"result\");\n\n    let phoneNumberGlobal = '';\n\n    form.addEventListener(\"submit\", async (e) => {\n      e.preventDefault();\n      const formData = new FormData(form);\n      const payload = Object.fromEntries(formData.entries());\n      phoneNumberGlobal = payload.phoneNumber;\n\n      const res = await fetch(\"/authtg\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify(payload)\n      });\n      const data = await res.json();\n\n      if (data.topic === \"need_code\") {\n        codeDiv.style.display = \"block\";\n        resultDiv.className = \"\";\n        resultDiv.textContent = \"Enter the code sent to your Telegram.\";\n      } else if (data.topic === \"auth_success\") {\n        resultDiv.className = \"success\";\n        resultDiv.textContent = \"Authorization successful! Waiting for TG session...\";\n        pollForSession(phoneNumberGlobal);\n      } else if (data.topic === \"auth_error\") {\n        resultDiv.className = \"error\";\n        resultDiv.textContent = \"Error: \" + data.payload.error;\n      }\n    });\n\n    document.getElementById(\"sendCode\").addEventListener(\"click\", async () => {\n      const phoneCode = document.getElementById(\"phoneCode\").value;\n\n      const res = await fetch(\"/authtg_code\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ phoneNumber: phoneNumberGlobal, phoneCode })\n      });\n\n      const data = await res.json();\n\n      if (data.topic === \"auth_success\") {\n        resultDiv.className = \"success\";\n        resultDiv.textContent = \"Code accepted! Waiting for TG session...\";\n        pollForSession(phoneNumberGlobal);\n      } else {\n        resultDiv.className = \"error\";\n        resultDiv.textContent = \"Error: \" + (data.error || \"Unknown error\");\n      }\n    });\n\n    async function pollForSession(phoneNumber) {\n      const intervalId = setInterval(async () => {\n        const res = await fetch(\"/get_session\", {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify({ phoneNumber })\n        });\n        const data = await res.json();\n        if (data.stringSession) {\n          clearInterval(intervalId);\n          resultDiv.className = \"success\";\n          resultDiv.textContent = \"TG Session received: \" + data.stringSession;\n        }\n      }, 3000);\n    }\n  </script>\n</body>\n</html>\n",
        "output": "str",
        "x": 440,
        "y": 340,
        "wires": [
            [
                "c18425d9b167871a"
            ]
        ]
    },
    {
        "id": "b0a311799a8ebd20",
        "type": "http in",
        "z": "5171de7e11632b7c",
        "name": "",
        "url": "/authtg",
        "method": "get",
        "upload": false,
        "swaggerDoc": "",
        "x": 250,
        "y": 340,
        "wires": [
            [
                "630c8d5ae77c99dd"
            ]
        ]
    },
    {
        "id": "c18425d9b167871a",
        "type": "http response",
        "z": "5171de7e11632b7c",
        "name": "",
        "statusCode": "",
        "headers": {},
        "x": 630,
        "y": 340,
        "wires": []
    },
    {
        "id": "e1c470c79cdc6e5e",
        "type": "http in",
        "z": "5171de7e11632b7c",
        "name": "",
        "url": "/authtg",
        "method": "post",
        "upload": false,
        "swaggerDoc": "",
        "x": 250,
        "y": 400,
        "wires": [
            [
                "8a2bdcc91b0e57f2"
            ]
        ]
    },
    {
        "id": "b75a42cd46a5739b",
        "type": "http response",
        "z": "5171de7e11632b7c",
        "name": "",
        "statusCode": "",
        "headers": {},
        "x": 790,
        "y": 400,
        "wires": []
    },
    {
        "id": "38fa03db4cb03cde",
        "type": "function",
        "z": "5171de7e11632b7c",
        "name": "resp topic",
        "func": "const topic = msg.topic;\n\nif(topic == \"need_code\"){\n    msg.payload = { topic };\n    msg.statusCode = 200;\n} else if(topic == \"auth_success\"){\n  const {phoneNumber, stringSession} = msg.payload;\n  flow.set(`${phoneNumber}_session`,stringSession)\n}\n else if(topic == \"auth_error\"){\n    msg.statusCode = 200;\n    msg.payload = {\n        error: msg.payload.error,\n    }\n}\n\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 640,
        "y": 400,
        "wires": [
            [
                "b75a42cd46a5739b",
                "bc02748dc82b1569"
            ]
        ]
    },
    {
        "id": "25d7ece670cc473b",
        "type": "http in",
        "z": "5171de7e11632b7c",
        "name": "",
        "url": "/authtg_code",
        "method": "post",
        "upload": false,
        "swaggerDoc": "",
        "x": 270,
        "y": 460,
        "wires": [
            [
                "ea875271ac9ed55e"
            ]
        ]
    },
    {
        "id": "ea875271ac9ed55e",
        "type": "function",
        "z": "5171de7e11632b7c",
        "name": "function 2",
        "func": "const { phoneNumber , phoneCode} = msg.payload;\nconst sessionContext = `phoneCode_${phoneNumber}`;\nconst phoneResolveFN = flow.get(sessionContext) || null;\n\nif (phoneResolveFN){\n    phoneResolveFN(phoneCode);\n    flow.set(`phoneCode_${phoneNumber}`, undefined)\n    msg.payload = {\n        topic:\"auth_success\"\n        \n    }\n} else {\n    msg.payload  = {\n        topic:\"auth_error\",\n        error: msg.payload.error\n    }\n}\n\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 440,
        "y": 460,
        "wires": [
            [
                "9cc62be71e8b11b6"
            ]
        ]
    },
    {
        "id": "9cc62be71e8b11b6",
        "type": "http response",
        "z": "5171de7e11632b7c",
        "name": "",
        "statusCode": "",
        "headers": {},
        "x": 650,
        "y": 460,
        "wires": []
    },
    {
        "id": "54d2487822786b73",
        "type": "http in",
        "z": "5171de7e11632b7c",
        "name": "",
        "url": "/get_session",
        "method": "post",
        "upload": false,
        "swaggerDoc": "",
        "x": 270,
        "y": 520,
        "wires": [
            [
                "7252f7b233fd26a6"
            ]
        ]
    },
    {
        "id": "7252f7b233fd26a6",
        "type": "function",
        "z": "5171de7e11632b7c",
        "name": "function 1",
        "func": "const {phoneNumber} = msg.payload;\nconst stringSession = flow.get(`${phoneNumber}_session`)\n\nif(stringSession){\n    msg.statusCode = 200;\n    msg.payload = { stringSession }\n} else {\n    msg.statusCode = 404;\n    msg.payload = \"Not found session\"\n}\n  \nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 440,
        "y": 520,
        "wires": [
            [
                "299e07a303d9f95b"
            ]
        ]
    },
    {
        "id": "299e07a303d9f95b",
        "type": "http response",
        "z": "5171de7e11632b7c",
        "name": "",
        "statusCode": "",
        "headers": {},
        "x": 630,
        "y": 520,
        "wires": []
    },
    {
        "id": "bc02748dc82b1569",
        "type": "debug",
        "z": "5171de7e11632b7c",
        "name": "debug 3",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 840,
        "y": 460,
        "wires": []
    },
    {
        "id": "cfdf634b071aea4e",
        "type": "send-message",
        "z": "5171de7e11632b7c",
        "name": "",
        "chatId": "me",
        "message": "hi",
        "config": "b2d6243c0a48361f",
        "parseMode": "md",
        "schedule": "",
        "replyTo": "",
        "attributes": "",
        "formattingEntities": "",
        "linkPreview": false,
        "file": [],
        "thumb": "",
        "forceDocument": false,
        "clearDraft": false,
        "buttons": "",
        "silent": false,
        "supportStreaming": false,
        "noforwards": false,
        "commentTo": "",
        "topMsgId": "",
        "x": 560,
        "y": 600,
        "wires": [
            [
                "053ea34c076f6868",
                "8808c6f42754b2ad"
            ]
        ]
    },
    {
        "id": "f2adb91cc2488901",
        "type": "inject",
        "z": "5171de7e11632b7c",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 260,
        "y": 600,
        "wires": [
            [
                "cfdf634b071aea4e"
            ]
        ]
    },
    {
        "id": "e0d57eca63871bcb",
        "type": "iter-dialogs",
        "z": "5171de7e11632b7c",
        "name": "",
        "config": "b2d6243c0a48361f",
        "limit": "",
        "offsetDate": "",
        "offsetId": "",
        "ignorePinned": false,
        "ignoreMigrated": false,
        "folder": 0,
        "archived": "",
        "x": 460,
        "y": 760,
        "wires": [
            [
                "053ea34c076f6868"
            ]
        ]
    },
    {
        "id": "bf3006a5bb00f45e",
        "type": "inject",
        "z": "5171de7e11632b7c",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 260,
        "y": 760,
        "wires": [
            [
                "e0d57eca63871bcb"
            ]
        ]
    },
    {
        "id": "053ea34c076f6868",
        "type": "debug",
        "z": "5171de7e11632b7c",
        "name": "debug 4",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 740,
        "y": 660,
        "wires": []
    },
    {
        "id": "cbece7e458e62653",
        "type": "receiver",
        "z": "5171de7e11632b7c",
        "name": "",
        "config": "b2d6243c0a48361f",
        "ignore": "",
        "x": 460,
        "y": 820,
        "wires": [
            [
                "053ea34c076f6868"
            ]
        ]
    },
    {
        "id": "19e84923ab9116b4",
        "type": "get-entity",
        "z": "5171de7e11632b7c",
        "name": "",
        "config": "b2d6243c0a48361f",
        "x": 460,
        "y": 900,
        "wires": [
            [
                "053ea34c076f6868"
            ]
        ]
    },
    {
        "id": "b24091e61bfae4fa",
        "type": "inject",
        "z": "5171de7e11632b7c",
        "name": "",
        "props": [
            {
                "p": "payload.input",
                "v": "me",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 260,
        "y": 900,
        "wires": [
            [
                "19e84923ab9116b4"
            ]
        ]
    },
    {
        "id": "e2ad94df0e604d01",
        "type": "delete-message",
        "z": "5171de7e11632b7c",
        "name": "",
        "config": "b2d6243c0a48361f",
        "x": 520,
        "y": 660,
        "wires": [
            [
                "053ea34c076f6868"
            ]
        ]
    },
    {
        "id": "ae41ca08ef619e9f",
        "type": "function",
        "z": "5171de7e11632b7c",
        "name": "function 3",
        "func": "msg.payload = {\n    chatId: msg.payload.response.peerId.userId,\n    messageIds: [msg.payload.response.id]\n}\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 340,
        "y": 660,
        "wires": [
            [
                "e2ad94df0e604d01"
            ]
        ]
    },
    {
        "id": "8808c6f42754b2ad",
        "type": "delay",
        "z": "5171de7e11632b7c",
        "name": "",
        "pauseType": "delay",
        "timeout": "15",
        "timeoutUnits": "seconds",
        "rate": "1",
        "nbRateUnits": "1",
        "rateUnits": "second",
        "randomFirst": "1",
        "randomLast": "5",
        "randomUnits": "seconds",
        "drop": false,
        "allowrate": false,
        "outputs": 1,
        "x": 180,
        "y": 660,
        "wires": [
            [
                "ae41ca08ef619e9f"
            ]
        ]
    },
    {
        "id": "b2d6243c0a48361f",
        "type": "config",
        "name": "I am",
        "api_id": "16889767",
        "api_hash": "a0cb20557627f8a8f0b163339e1fd0b0",
        "session": "1AgAOMTQ5LjE1NC4xNjcuNTABuyipDrGuoYMB2xwTcdEGGalLx2WP5HW5DedbmzIhe7cdiePqKseALuXcUUMLCDSF7oxHzpEifMAqojyIYRManiCERxbHeo/Pi6gKo3tGW66CmwLwSHGcLpBWjJEAAtHjf+iqeX4NuxbkHUovdpH3xZcwisuHoDPVnB+dFZ6xfVDwF0wqDXKeHauXh3UGFCSeNzntMzVs/NPcOmmSfqjj4Ie1b1E57ry35go8dTthUB39rav1UY/4BSoG+M3mthcKGOGuJyu+BHsH33pfxVKSpe0bg0wa6E7ijGGqfLLmOC+ZSw4GuO8CX9hVN56c2imjvnuYCEguQKOEVtzyPIeLS2Q=",
        "useIPV6": false,
        "timeout": "",
        "requestRetries": "",
        "connectionRetries": "",
        "proxy": "",
        "downloadRetries": "",
        "retryDelay": "",
        "autoReconnect": false,
        "sequentialUpdates": false,
        "floodSleepThreshold": "",
        "deviceModel": "",
        "systemVersion": "",
        "appVersion": "",
        "langCode": "",
        "systemLangCode": "",
        "useWSS": false,
        "maxConcurrentDownloads": "",
        "securityChecks": false,
        "testServers": false
    }
]
```