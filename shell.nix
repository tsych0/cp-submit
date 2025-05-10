{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    # Core development tools
    nodejs
    nodePackages.npm
    nodePackages.web-ext

    # Firefox for testing
    firefox

    # Optional development utilities
    jq
    zip
    unzip
  ];

  shellHook = ''
    echo "Firefox Extension Development Environment"
    echo "Available tools:"
    echo " - Node.js $(node --version)"
    echo " - npm $(npm --version)"
    echo " - web-ext $(web-ext --version)"
    echo " - Firefox $(firefox --version | cut -d ' ' -f 3)"
  '';
}
