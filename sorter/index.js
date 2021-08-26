/**
 * @fileOverview Sorter
 * @name index.js
 * @author Matthijs Tempels <matthijs@townsville.nl>
 * @license Townsville.nl
 */

"use strict";

const logger = require('townsville-logger');
const path = require('path');
const fs = require('fs');
const glob = require("glob")

/**
 * Main service class
 */
class Service {
    /**
     * Class constructor
     * @param {object} settings Service settings
     */
    constructor(settings) {
        this._init(settings);
    }

    /**
     * Run service
     */
    run() {
        let options = {
            nodir: true,
            absolute: true
        };
        glob("**/*.jpg", options, (err, files) => {
            files.forEach(original_file => {
                //2020-04-10 00.07.15.jpg
                let in_filename = path.basename(original_file);
                let in_dirname = path.dirname(original_file);
                let folder_date = in_dirname.split("/").pop();
                let file_date = in_filename.split(" ")[0];
                let output_path = this._out_path + "/" + file_date;
                if (!fs.existsSync(output_path)) {
                    fs.mkdirSync(output_path, {
                        recursive: true
                    });
                }
                let output_file = output_path + "/" + in_filename;
                this.movefile(original_file, output_file);
            });
        });
    }



    movefile(in_file, out_file) {
        if (this._dry_run) {
            this._log.debug("[DRY RUN] I would move %s to %s... ", in_file, out_file);
        } else {
            this._log.debug("Moving %s to %s... ", in_file, out_file);
            fs.rename(in_file, out_file, (err) => {
                if (err) throw err;
            });
        }
    }

    /**
     * Close service
     */
    close() {

    }


    // ---- Private ----

    /**
     * Init class
     * @param {object} settings Settings object
     * @throws {Error} If settings are bad
     */
    _init(settings) {
        this._in_path = settings.in_path;
        this._out_path = settings.out_path;
        this._dry_run = settings.dry_run;
        this._log = logger.createLogger('mover');
        this.run();
    }
}

// Exports
module.exports = Service;