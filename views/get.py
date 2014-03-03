from flask import request


def index():
    return str(request.user_agent)