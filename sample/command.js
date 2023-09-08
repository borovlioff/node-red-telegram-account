const { NewMessage } = require("telegram/events");

// event.js
module.exports = function (RED) {
  function Command(config) {
    RED.nodes.createNode(this, config);
    this.config = RED.nodes.getNode(config.config);
    var node = this;
    /** @type {TelegramClient} */
    const client =  this.config.client;

    

    try {
      client.addEventHandler((update) => {
        const message = update.message.message
        if (message) {
            if (config.regex) {
                const regex = new RegExp(config.command);

                if (regex.test(message)) {
                    // Создаем объект сообщения для отправки в следующий узел
                    var msg = {
                        payload: {
                            update
                            // Другие поля сообщения, которые вы хотите передать
                        }
                    };

                    // Отправляем объект сообщения в следующий узел
                    node.send(msg);
                }
            } else if (message === config.command) {
                // Создаем объект сообщения для отправки в следующий узел
                var msg = {
                    payload: {
                        update
                        // Другие поля сообщения, которые вы хотите передать
                    }
                };

                // Отправляем объект сообщения в следующий узел
                node.send(msg);
            }
        }
      }, new NewMessage());
      
    } catch (err) {
      node.error('Ошибка авторизации: ' + err.message);
    }

  }

  RED.nodes.registerType('command', Command);
};
