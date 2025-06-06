# Important: Must be run first to copy environment vars to config
import env_to_config
env_to_config.copy_env_to_config()

# Now the code

import configparser
import psiturk.experiment_server as exp

config = configparser.ConfigParser()
config.read('config.txt')
sp = config['Server Parameters']

host = 'http://localhost' if sp['host'] == '0.0.0.0' else sp['host']
print(f'Server listening on {host}:{sp["port"]}')

exp.launch()
