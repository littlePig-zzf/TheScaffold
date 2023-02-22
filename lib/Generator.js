import {getRepoList, getTagList} from './http.js'
import ora from 'ora'
import path from 'path'
import inquirer from 'inquirer'
import util from 'util'
import downloadGitRepo from 'download-git-repo'
import chalk from 'chalk'

// 添加加载动画
async function wrapLoading(fn, message, ...args) {
  // 使用 ora 初始化，传入提示信息 message
  const spinner = ora(message);
  // 开始加载动画
  spinner.start();

  try {
    // 执行传入方法 fn
    const result = await fn(...args);
    // 状态为修改为成功
    spinner.succeed();
    return result; 
  } catch (error) {
    // 状态为修改为失败
    spinner.fail('Request failed, refetch ...')
  } 
}

class Generator {
  constructor (name, targetDir) {
    // 目录名称
    this.name = name
    // 创建位置
    this.targetDir = targetDir

    this.downloadGitRepo = util.promisify(downloadGitRepo);
  }

  async getRepo () {
    const repoList = await wrapLoading(getRepoList, 'waiting fetch template')
    if(!repoList) return

    const repos = repoList.map((item) => item.name)

    // 2）用户选择自己新下载的模板名称
    const { repo } = await inquirer.prompt({
      name: 'repo',
      type: 'list',
      choices: repos,
      message: 'Please choose a template to create project'
    })

    return repo 

  }

  async getTag (repo) {
    const tags = await wrapLoading(getTagList, 'waiting fetch tag', repo)
    if(!tags) return

    const tagsList = tags.map((item) => item.name)

    // 2）用户选择自己新下载的模板名称
    const { tag } = await inquirer.prompt({
      name: 'tag',
      type: 'list',
      choices: tagsList,
      message: 'Please choose a tag to create project'
    })

    return tag 

  }

  async download(repo, tag) {
        // 1）拼接下载地址
        const requestUrl = `superwoman-zzf/${repo}${tag?'#'+tag:''}`;

        // 2）调用下载方法
        await wrapLoading(
          this.downloadGitRepo, // 远程下载方法
          'waiting download template', // 加载提示信息
          requestUrl, // 参数1: 下载地址
          path.resolve(process.cwd(), this.targetDir)) // 参数2: 创建位置
  }

  async create() {
    const repo = await this.getRepo()
    const tag = await this.getTag(repo)
    await this.download(repo, tag)
    // 4）模板使用提示
    console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
    console.log(`\r\n  cd ${chalk.cyan(this.name)}`)
    console.log('  npm run dev\r\n')
   
  }
}

export default Generator;