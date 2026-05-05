-- * ---------------------------------------------------------------------- * 
-- *                                                                        * 
-- *  FILE NAME........: PRE013SP                                           * 
-- *  CREATED BY.......: PROGRAMMERS.IO                                     * 
-- *  CREATE DATE......: 03/06/2026                                         * 
-- *  DESCRIPTION......:                                                    * 
-- *                     NOTE: RUNSQLSTM                                    *  
-- *                           SRCSTMF('/HOME/NODEJS/DAILYADJ/PRE013SP.SQL')*  
-- *                           COMMIT(*NONE) MARGINS(112)                   *  
-- *                           DFTRDBCOL(PIOMPARIHA)                        *
-- * -------------------- ------------------------------------------------- * 
-- *           - -   M O D I F I C A T I O N   L O G  - -                   * 
-- * ---------------------------------------------------------------------- * 
-- *  PIO 00/00/00 00:00 -                                                  * 
-- *                                                                        * 
-- * ---------------------------------------------------------------------- *                                          

CREATE OR REPLACE PROCEDURE USP_DAILY_ADJUSTMENT_REPORT_PRE013SP
(
    IN PARM1 CHAR(10),
    IN PARM2 CHAR(10)
)
DYNAMIC RESULT SETS 1
SPECIFIC PRE013SP
LANGUAGE CL
PARAMETER STYLE GENERAL
EXTERNAL NAME 'PIOMPARIHA/PRR013CL'
NOT DETERMINISTIC
MODIFIES SQL DATA;

