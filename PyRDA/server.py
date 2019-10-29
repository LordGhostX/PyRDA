import datetime
import io
import socket
import pyautogui
import tornado.ioloop, tornado.locks, tornado.template, tornado.web, tornado.websocket

def take_ss():
    byte_arr = io.BytesIO()
    pyautogui.screenshot().save(byte_arr, format='JPEG')
    return byte_arr.getvalue()

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('255.255.255.255', 1))
        IP = s.getsockname()[0]
    except:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        loader = tornado.template.Loader(".")
        self.write(loader.load("client/index.html").generate())

class WSHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        prtsc = pyautogui.screenshot()
        self.write_message("size {} {}".format(prtsc.width, prtsc.height))
        self.send_ss()

    def on_message(self, message):
        splitted = message.split(" ")
        if splitted[0] == "key":
            keys = splitted[1:]
            pyautogui.hotkey(*keys)
        elif splitted[0] == "mouse":
            button_mapping = {"0": "left", "1": "right", "2": "middle"}
            button = button_mapping[splitted[1].lower()]
            pyautogui.click(button=button)
        elif splitted[0] == 'move':
            x = float(splitted[1])
            y = float(splitted[2])
            pyautogui.moveTo(x, y)

    def on_close(self):
        pass


    def send_ss(self):
        try:
            self.write_message(take_ss(), binary=True)
            tornado.ioloop.IOLoop.current().add_timeout(datetime.timedelta(milliseconds=50), self.send_ss)
        except KeyboardInterrupt:
            exit()
        except:
            pass

application = tornado.web.Application([
    (r'/ws', WSHandler),
    (r'/', MainHandler),
    (r"/(.*)", tornado.web.StaticFileHandler, {"path": "./client"}),
])

if __name__ == "__main__":
    port_number = 10000
    application.listen(port_number)

    host = "{}:{}".format(get_ip(), port_number)
    print(host)
    try:
        tornado.ioloop.IOLoop.instance().start()
    except:
        tornado.ioloop.IOLoop.instance().stop()
