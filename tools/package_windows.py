"""Create a private source/start package with verified official portable Node.

No credentials, installed app dependencies or cloud configuration are copied.
The fresh Git metadata allows the app's updater to recognize the source.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tempfile
import zipfile


def git(*args, cwd=None):
    return subprocess.check_output(['git', *map(str,args)], cwd=cwd, text=True).strip()


def package(root, node_archive, checksums, output):
    if git('status','--porcelain',cwd=root):
        raise SystemExit('Commit changes before packaging a reproducible source snapshot.')
    if node_archive.name not in checksums.read_text():
        raise SystemExit('Archive missing in checksum manifest.')
    expected = None
    for line in checksums.read_text().splitlines():
        fields = line.split()
        if len(fields)==2 and fields[1]==node_archive.name:
            expected=fields[0]
    digest=hashlib.sha256(node_archive.read_bytes()).hexdigest()
    if digest!=expected:
        raise SystemExit('Node archive checksum mismatch.')
    if not node_archive.name.startswith('node-v24.') or not node_archive.name.endswith('-win-x64.zip'):
        raise SystemExit('Expected Windows x64 Node 24 archive.')
    commit=git('rev-parse','HEAD',cwd=root)
    version=json.loads((root/'package.json').read_text())['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+',version):
        raise SystemExit('Expected numeric application version in package.json.')
    delivery_folder=f'AI-Chess-Studio-{version}'
    with tempfile.TemporaryDirectory(prefix='chess-package-') as temporary:
        stage=Path(temporary)/'AI-Chess-Studio'
        subprocess.run(['git','clone','--no-local','--quiet',str(root),str(stage)],check=True)
        git('checkout','-B','work',commit,cwd=stage)
        git('remote','set-url','origin','https://github.com/wibem1/AI-Chess-Studio.git',cwd=stage)
        git('config','core.autocrlf','false',cwd=stage)
        git('config','core.filemode','false',cwd=stage)
        for name in ['logs','hooks']:
            shutil.rmtree(stage/'.git'/name,ignore_errors=True)
        prefix=node_archive.stem+'/'
        runtime=stage/'runtime'/'node'
        with zipfile.ZipFile(node_archive) as archive:
            for member in archive.infolist():
                if not member.filename.startswith(prefix):
                    raise SystemExit('Unexpected runtime archive layout.')
                relative=PurePosixPath(member.filename[len(prefix):])
                if relative.is_absolute() or '..' in relative.parts:
                    raise SystemExit('Unsafe runtime archive path.')
                destination=runtime.joinpath(*relative.parts)
                if member.is_dir():
                    destination.mkdir(parents=True,exist_ok=True)
                else:
                    destination.parent.mkdir(parents=True,exist_ok=True)
                    with archive.open(member) as source,destination.open('wb') as target:
                        shutil.copyfileobj(source,target)
        if (runtime/'node.exe').read_bytes()[:2]!=b'MZ' or not (runtime/'node_modules/npm/bin/npm-cli.js').is_file():
            raise SystemExit('Expected Windows Node/npm runtime files absent.')
        (stage/'PAKET-INFORMATION.json').write_text(json.dumps({
            'version':version,'source_commit':commit,'node_archive':node_archive.name,'node_sha256':digest,
            'windows_native_tested':False,'includes_api_key':False,
            'first_start_needs_internet_for_dependencies':True,
        },indent=2)+'\n',encoding='utf-8')
        # Ignore delivery metadata so it does not block future fast-forward updates.
        with (stage/'.git/info/exclude').open('a') as exclude:
            exclude.write('\nPAKET-INFORMATION.json\n')
        output.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
            for path in sorted(stage.rglob('*')):
                if path.is_file():
                    archive.write(path,Path(delivery_folder)/path.relative_to(stage))
    result={'version':version,'source_commit':commit,'archive':output.name,'bytes':output.stat().st_size,
            'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    output.with_suffix(output.suffix+'.sha256').write_text(result['sha256']+'  '+output.name+'\n')
    print(json.dumps(result))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--node-archive',type=Path,required=True)
    parser.add_argument('--node-checksums',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    package(Path(__file__).resolve().parents[1],args.node_archive.resolve(),args.node_checksums.resolve(),args.output.resolve())
