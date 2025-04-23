import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';

export async function pushGeneratedOverlaysSubfolder(deploymentPath: string): Promise<void> {
    const generatedOverlaysPath = path.resolve(process.cwd(), 'generated-overlays');
    const relPath = path.relative(generatedOverlaysPath, deploymentPath);

    console.log('gen path', generatedOverlaysPath);
    const git = simpleGit(generatedOverlaysPath);

    const msg = `chore: updated ${deploymentPath} overlay`;
    console.log(msg);

    await git.add(['-u', relPath]);
    await git.commit(msg);

    await git.push('origin', 'master');
}

export async function deleteGeneratedOverlaysSubfolder(deploymentPath: string): Promise<void> {
    const generatedOverlaysPath = path.resolve(process.cwd(), 'generated-overlays');
    const git = simpleGit(generatedOverlaysPath);

    fs.rmSync(deploymentPath, { recursive: true, force: true });
    const relPath = path.relative(generatedOverlaysPath, deploymentPath);

    await git.add(['-u', relPath]);
    const msg = `chore: removed ${relPath} overlay`;
    await git.commit(msg);

    await git.push('origin', 'master');
}
