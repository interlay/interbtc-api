#!/bin/bash
CHAIN=$(echo $1 | tr '[:lower:]' '[:upper:]')

case $CHAIN in
  INTR | KINT)
    ;;
  *)
    echo "Unknown parachain: $1. Using default: KINT"
    CHAIN=KINT
    ;;
esac

DETACH_OPT=false
for arg; do
        if [[ $arg == "-d" ]]; then
            DETACH_OPT=true
        fi
done

echo "Preparing docker-compose files for $CHAIN parachain"

if ! [ -d "local-setup" ]
then
    mkdir local-setup
    git clone https://github.com/interlay/parachain-launch/
    cd parachain-launch && git checkout dan/testnet-loans && yarn install
    yarn start generate --config=configs/kintsugi.yml --servicesPath=configs/kintsugi-services.yml --yes --output=local-setup-kint
    mv local-setup-kint ../local-setup/kint
    yarn start generate --config=configs/interlay.yml --servicesPath=configs/interlay-services.yml --yes --output=local-setup-intr
    mv local-setup-intr ../local-setup/intr
    cd ../
    rm -rf parachain-launch
fi

case $CHAIN in
    INTR)
        cp ./local-setup/intr/* ./local-setup/
        ;;
    KINT | *)
        cp ./local-setup/kint/* ./local-setup/
        ;;
esac

if $DETACH_OPT; then
  cd local-setup && docker-compose up --build --detach
else
  cd local-setup && docker-compose up --build
fi