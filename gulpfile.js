const gulp = require('gulp');
const execa = require('execa');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const semver = require('semver');

if (os.platform()==='win32'){
    throw new Error('only build this project on posix systems because monaco import paths contain backslashes when built on windows');
}

const VSCODE = path.resolve(__dirname, 'vscode');
const MONACO_TS = path.resolve(__dirname, 'monaco-typescript');
const MONACO_EDITOR = path.resolve(__dirname, 'monaco-editor');

gulp.task('clean', async () => {

    for (const dir of [VSCODE, MONACO_TS, MONACO_EDITOR, __dirname]) {
        console.log('cleaning nodemodules in', dir);
        await execa('rimraf', ['node_modules'], { cwd: dir, stdio: 'inherit' });
    }
});

gulp.task('init', async () => {

    console.log('Installing vscode deps');
    const file = os.platform() === 'win32' ? 'npm.bat' : './npm.sh';
    await execa(file, ['install'], { cwd: path.resolve(VSCODE, 'scripts'), stdio: 'inherit', env: { IGNOREYARNWARNING: 'true' } });

    console.log('Installing monaco-typescript deps');
    await execa('npm', ['install'], { cwd: MONACO_TS, stdio: 'inherit' });
});

gulp.task('build', async () => {

    // use "npm run gulp" because this has cmd line arg that helps us (see package.json)
    await execa('npm', ['run', 'gulp', '--', 'editor-distro'], { cwd: VSCODE, stdio: 'inherit' });

    // cannot install in init task because needed to run editor distro gulp task first so that npm install works (because of file://... in package.json)
    console.log('Installing monaco-editor deps');
    await execa('npm', ['install'], { cwd: MONACO_EDITOR, stdio: 'inherit' });

    await execa('npm', ['run', 'release'], { cwd: MONACO_EDITOR, stdio: 'inherit' });
});

async function readjson(pkgjson) {
    const obj = JSON.parse((await fs.readFile(pkgjson)).toString());
    return obj;
}

gulp.task('publish', async () => {
    const jsonrelease = await readjson(path.resolve(MONACO_EDITOR, 'release', 'package.json'));
    const json = await readjson(path.resolve(MONACO_EDITOR, 'package.json'));
    delete json.private;
    delete jsonrelease.private;
    if (jsonrelease.version === json.version && JSON.stringify(jsonrelease) !== JSON.stringify(json)) {
        throw new Error('json not equal');
    }
    json.name = '@neoncom/monaco-editor';
    const monver = json.version;
    console.log('monver', monver);

    const major = semver.major(monver);
    const minor = semver.minor(monver);
    const patch = semver.patch(monver);
    const myPatchNum = parseInt((await fs.readFile('patchfile')).toString());
    const newMyPatchNum = myPatchNum + 1;
    json.version = `${major + 1}.${minor}.${patch + newMyPatchNum}`;

    await fs.writeFile('patchfile', newMyPatchNum.toString());
    await fs.writeFile(path.resolve(MONACO_EDITOR, 'release', 'package.json'), JSON.stringify(json, null, 4));

    console.log('NOW RUN npm publish in monaco-editor/release as neoncom npm user');
})