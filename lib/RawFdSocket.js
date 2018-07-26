const stream = require('stream');
const StringDecoder = require('string_decoder').StringDecoder;
const ErrNo = require('errno')
const RawFd = require('../build/Release/RawFd.node');

class RawFdSocket extends stream.Duplex {

    constructor(fd, options) {
        options = options || {};
        super({
            decodeStrings: true,
            highWaterMark: options.highWaterMark,
            encoding: options.encoding
        });

        this._impl = new RawFd(fd, this.onRead.bind(this));
    }

    _write(chunk, encoding, callback) {
        if (encoding !== 'buffer')
            chunk = Buffer.from(chunk, encoding);
        const ret = this._impl.write(chunk);

        let err = null;
        // if (ret > 0) {
        //     errno = ErrNo.errno[ret];
        //     const err = new SystemError(errno.description);
        //     err.syscall = "write";
        //     err.errno = errno.errno;
        //     err.code = errno.code;
        // }
        callback(err);
    }

    _read(size) {
        this._impl.start();
    }

    onRead(errno, buf) {
        if (errno > 0) {
            //TODO emit close event
            //
            // errno = ErrNo.errno[errno];
            // const err = new SystemError(errno.description);
            // err.syscall = "read";
            // err.errno = errno.errno;
            // err.code = errno.code;

            process.nextTick(() => this.emit('error', {}));
            return;
        }
        if (!this.push(buf)) {
            this._impl.stop();
        }
    }

    _destroy(err, cb) {
        try {
            this._impl.close();
        } catch (e) {
            return cb(e);
        }
        cb();
    }

    _final(cb) {
        return this.close(null, cb);
    }
}

module.exports = RawFdSocket;
