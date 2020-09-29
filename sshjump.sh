#!/bin/bash
echo "port forwarding starting..."

#ssh -CfNg -L <本机端口>:<目标IP>:<目标端口> 用户名@跳转机IP
#ssh -CfNg -L 3316:8.8.8.8:3306 root@114.114.114.114
#说明：.env文件里面，数据库配置，DB_HOST=127.0.0.1， DB_PORT=3316。用本脚本建立端口转发之后，可访问目标服务器的数据库

ps -ef | grep ssh

#killall ssh
