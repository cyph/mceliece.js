#define LOG_LENGTH 12
#define ERROR_WEIGHT 60

#define REDUC 1
#define ERROR_SIZE 446
// rounded down from 446.208
// log_2(binomial(2^12,60)) = 447.241
// log_2(binomial(2^11,60)) + 1 * 60 = 446.608
// security loss is 1.2406
// final security is 155.835
