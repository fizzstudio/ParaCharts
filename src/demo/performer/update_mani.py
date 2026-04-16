import json
import time
import argparse
import random
from pathlib import Path


def main(args):
    with open(args.manifest) as f:
        mani = json.load(f)
    data = mani['jim']['datasets'][0]['series'][0]['records']
    # mani['jim']['datasets'][0]['series'][0]['records'][0]['x']
    yrange = args.max - args.min
    while True:
        time.sleep(args.interval)
        data.pop(0)
        data.append({'x': nextx(data[-1]['x']), 'y': str(args.min + random.random()*yrange)})
        with open(args.manifest, 'w') as f:
            json.dump(mani, f, indent=2)


def nextx(x):
    q, y = x.split(' ')
    qnum = (int(q[1]) - 1 + 1) % 4
    q = 'Q' + str(qnum + 1)
    if not qnum:
        y = str(int(y) + 1)
    return q + ' ' + y

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest',
                        help='manifest file to update')
    parser.add_argument('interval',
                        type=float,
                        help='update interval in seconds')
    parser.add_argument('min',
                        type=float,
                        help='generated data range minimum')
    parser.add_argument('max',
                        type=float,
                        help='generated data range maximum')
    # parser.add_argument('charts', nargs='*',
    #                     help='list of charts to include')
    # parser.add_argument('-r', '--range', default='',
    #                     help='range of data values to generate (as `start-end`)')
    args = parser.parse_args()
    main(args)
