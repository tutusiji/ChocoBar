#!/usr/bin/env node

/**
 * 版本号自动递增脚本
 *
 * 功能：
 * 1. 读取当前版本号
 * 2. 递增 patch 版本（0.2.0 -> 0.2.1）
 * 3. 更新所有版本号文件：
 *    - package.json
 *    - src-tauri/Cargo.toml
 *    - src-tauri/tauri.conf.json
 *    - src-tauri/src/commands.rs
 */

const fs = require('fs');
const path = require('path');

// 读取当前版本号
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// 解析版本号
const [major, minor, patch] = currentVersion.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

console.log(`📦 版本号递增: ${currentVersion} -> ${newVersion}`);

// 更新 package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ 更新 package.json');

// 更新 Cargo.toml
const cargoTomlPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${newVersion}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log('✅ 更新 Cargo.toml');

// 更新 tauri.conf.json
const tauriConfPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
let tauriConf = fs.readFileSync(tauriConfPath, 'utf8');
tauriConf = tauriConf.replace(/"version": ".*"/, `"version": "${newVersion}"`);
fs.writeFileSync(tauriConfPath, tauriConf);
console.log('✅ 更新 tauri.conf.json');

// 更新 commands.rs
const commandsRsPath = path.join(__dirname, '..', 'src-tauri', 'src', 'commands.rs');
let commandsRs = fs.readFileSync(commandsRsPath, 'utf8');

// 更新 get_app_info 中的版本号
commandsRs = commandsRs.replace(
  /"version": ".*",(\s*\/\/ get_app_info)/,
  `"version": "${newVersion}",$1`
);

// 更新 check_update 中的版本号
commandsRs = commandsRs.replace(
  /"current_version": ".*",(\s*\/\/ check_update)/,
  `"current_version": "${newVersion}",$1`
);
commandsRs = commandsRs.replace(
  /"latest_version": ".*",(\s*\/\/ check_update)/,
  `"latest_version": "${newVersion}",$1`
);

// 如果没有注释标记，使用更通用的替换
if (!commandsRs.includes('"version": "' + newVersion + '"')) {
  commandsRs = commandsRs.replace(
    /"version": "[^"]*"/g,
    `"version": "${newVersion}"`
  );
}
if (!commandsRs.includes('"current_version": "' + newVersion + '"')) {
  commandsRs = commandsRs.replace(
    /"current_version": "[^"]*"/g,
    `"current_version": "${newVersion}"`
  );
}
if (!commandsRs.includes('"latest_version": "' + newVersion + '"')) {
  commandsRs = commandsRs.replace(
    /"latest_version": "[^"]*"/g,
    `"latest_version": "${newVersion}"`
  );
}

fs.writeFileSync(commandsRsPath, commandsRs);
console.log('✅ 更新 commands.rs');

console.log(`\n🎉 版本号已更新为 ${newVersion}`);
console.log('💡 提示：请提交代码后执行 npm run tauri:build 进行打包');
