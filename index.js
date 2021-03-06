#!/usr/bin/env node

/**
 * @fileOverview Main entry point of the NYC File Sorter
 * @name index.js
 * @author Matthijs Tempels <matthijs@townsville.nl>
 * @license Townsville.nl
 */

"use strict";

const fs = require('fs');
const logger = require('townsville-logger');
const nconf = require('nconf');
const SorterService = require('./sorter/index.js');
const util = require('util');
const path = require('path');
const {
    Console
} = require('console');

/**
 * Show usage and exit
 */
function doUsageExit() {
    console.log(util.format('Usage: %s [options]', process.argv[1]));
    console.log(' options:');
    console.log(' --in <path> (<Absolute path where the <in> date folders are stored)');
    console.log(' --out <out> (<Absolute path where the <fixed> date folders will be stored)');
    console.log(' --dry-run (OPTIONAL)');
    console.log(' --help');
    process.exit(1);
}

/**
 * Handle commandline
 */
function handleCommandLine() {
    // Favor commandline params
    nconf.argv();
    // Check help
    if (nconf.get('help') || !nconf.get('in') || !nconf.get('out')) {
        doUsageExit();
    }
    // Check parameters
    let in_path = nconf.get('in');
    let out_path = nconf.get('out');
    let dry_run = nconf.get('dry-run');
    if (!fs.existsSync(in_path)) {
        console.log(util.format('Input Folder "%s" not found', in_path));
        doUsageExit();
    }
    if (!fs.existsSync(out_path)) {
        console.log(util.format('Output folder "%s" not found', out_path));
        doUsageExit();
    }
    return {
        "in_path": in_path,
        "out_path": out_path,
        "dry_run": dry_run
    };
}

/**
 * Obtain application version
 * @returns {string} Version string
 */
function getVersion() {
    try {
        let pkgJson = require(__dirname + '/package.json');
        if (pkgJson && pkgJson.version) {
            return pkgJson.version;
        }
    } catch (err) {}
    return '[unknown]';
}

// --- Main program ---

let log;
let inst;

// Catch fatal error and log it
process.on('uncaughtException', (err) => {

    if (log) {
        log.fatal(err.stack);
    } else {
        console.log(err.stack);
    }

    // Close the service
    if (inst) {
        inst.stop(() => {
            process.exit(1);
        });
    }

    // After 10 seconds close anyway.. (and hope the log flushes)
    setTimeout(
        () => {
            process.exit(2);
        },
        10000
    );
});

process.on('exit', () => {
    if (log) {
        log.info("Appliction exit!");
    } else {
        console.log("Application exit!");
    }
});

// Handle commandline
let params = handleCommandLine();

// Get log settings
const logSettings = {
    "name": "file-sorter",
    "showName": true,
    "level": "debug",
    "levels": {},
    "console": {
        "colorize": true
    },
    "file": {
        "path": "/tmp/nyc-file-sorter.log",
        "rollingFile": {
            "maxSize": 10000000,
            "maxFiles": 20
        }
    }
}
logger.init(logSettings);
log = logger.createLogger('index');
log.info('Application V%s started', getVersion());
// Instantiate service
inst = new SorterService(params);