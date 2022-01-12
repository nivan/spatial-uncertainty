from csv import writer
from csv import reader
import random

# Open the input_file in read mode and output_file in write mode
with open('users_score_dataset.csv', 'r') as read_obj, \
        open('preciptation_generated.csv', 'w', newline='') as write_obj:
    # Create a csv.reader object from the input file object
    csv_reader = reader(read_obj)
    # Create a csv.writer object from the output file object
    csv_writer = writer(write_obj)
    # Read each row of the input csv file as list
    for row in csv_reader:
        # Append the default text in the row / list
        line = str( round(random.uniform(0, 1), 4))
        row.append(line)
        # Add the updated row / list to the output file
        csv_writer.writerow(row)