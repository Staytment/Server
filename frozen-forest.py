from flask import Flask

import routes

app = Flask(__name__)
routes.register_views(app)

# For local debugging. Use foreman in production.
if __name__ == '__main__':
    app.run(debug=True)