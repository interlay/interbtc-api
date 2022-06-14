#!/bin/bash
if ! [ -d "local-setup" ]
then
    git clone https://github.com/interlay/parachain-launch/
    cd parachain-launch && git checkout 1.1.0-20220613 && yarn install
    yarn start generate --config=configs/kintsugi.yml --servicesPath=configs/kintsugi-services.yml --yes --output=local-setup
    mv local-setup ../
    cd ../
    rm -rf parachain-launch
fi

cd local-setup && docker-compose up --build --detach
