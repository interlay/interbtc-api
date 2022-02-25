import shell from 'shelljs';

const exec = (cmd: string, fatal = true) => {
    console.log(`$ ${cmd}`);
    const res = shell.exec(cmd);
    if (res.code !== 0) {
      console.error('Error: Command failed with code', res.code);
      console.log(res);
      if (fatal) {
        process.exit(1);
      }
    }
    return res;
};

exec('chmod +x ./scripts/docker-setup.sh');
exec('./scripts/docker-setup.sh');
