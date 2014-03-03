from flask import Flask

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return 'hello world'

# For local debugging. Use foreman in production.
if __name__ == '__main__':
    app.run()