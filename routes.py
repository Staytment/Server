from views import get, put, post, delete


def register_views(app):
    """
    Registers all views to their routes.

    :type app: flask.Flask
    """
    # GET views
    app.add_url_rule('/', view_func=get.index, methods=['GET'])
    # PUT views
    # POST views
    # DELETE views