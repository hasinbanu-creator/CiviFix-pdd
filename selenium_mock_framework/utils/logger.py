import logging
import os
from datetime import datetime

def setup_logger():
    logger = logging.getLogger("MockSeleniumFramework")
    logger.setLevel(logging.INFO)
    
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports", "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, f"execution_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    
    fh = logging.FileHandler(log_file)
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    
    return logger

log = setup_logger()
