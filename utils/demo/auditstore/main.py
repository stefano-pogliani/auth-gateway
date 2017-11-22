import argparse
from eve import Eve


def run(args):
    app = Eve()
    app.config.from_pyfile(args.config, silent=True)
    app.config['DEBUG'] = args.debug
    app.run(host=args.bind, port=args.port)


def command_args():
    parser = argparse.ArgumentParser(description='AuthGateway basic auditor')
    parser.add_argument(
        '--bind', default='0.0.0.0', type=str,
        help='Address to bind the server on'
    )
    parser.add_argument(
        '--config', default='local_settings.py', type=str,
        help='Path to an extra python config file'
    )
    parser.add_argument(
        '--debug', default=False, action='store_true',
        help='Enable debugging mode'
    )
    parser.add_argument(
        '--port', default=8092, type=int,
        help='Port to bind the server on'
    )
    return parser.parse_args()


def main():
    args = command_args()
    run(args)


if __name__ == '__main__':
    main()
